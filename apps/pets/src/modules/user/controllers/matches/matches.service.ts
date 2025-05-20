import {
  CustomLoggerService,
  GraphPetNode,
  ICityModel,
  IPetFollowModel,
  IPetMatchModel,
  IPetModel,
  IPetTypeModel,
  IUserModel,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
  PetMatch,
  PetMatchEventsEnum,
  PetMatchStatusEnum,
  RelationTypesEnum,
  User,
  addMaintainOrderStages,
  addPaginationStages,
} from '@instapets-backend/common';
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery, PipelineStage, Types } from 'mongoose';
import { GetMatchesQueryDto } from './dto/get-matches.dto';
import { errorManager } from '@pets/user/shared/config/error-manager.config';
import { Integer, int } from 'neo4j-driver';
import { getMatchedPetsAggregationPipeline } from './aggregations/get-matched-pets.aggregation';
import { RequestMatchDto } from './dto/request-match.dto';
import { PetFollowCreationHelperService } from '@pets/shared/services/pet-follow-creation-helper.service';
import { MatchIdParamDto } from './dto/match-id-param.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetMatchRequestsQueryDto } from './dto/get-match-requests.dto';

enum LocationFilterModesEnum {
  CITY = 'city',
  COUNTRY = 'country',
  GLOBAL = 'global',
}

enum PetTypeFilterModesEnum {
  INTERESTS = 'interests',
  CUSTOM = 'custom',
  NONE = 'none',
}

@Injectable()
export class MatchesService {
  constructor(
    @Inject(ModelNames.PET_MATCH) private petMatchModel: IPetMatchModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly neo4jService: Neo4jService,
    private readonly petFollowCreationHelperService: PetFollowCreationHelperService,
    private readonly logger: CustomLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMatches(userId: string, query: GetMatchesQueryDto) {
    const { page, limit, cityId, petTypeId } = query;
    const { page: _, limit: __, ...rest } = query;
    const isCustomQuery = Object.keys(rest).length > 0;

    const user = await this.userModel.findById(userId, { city: 1, country: 1 }).lean();

    if (!user?.city) {
      throw new UnprocessableEntityException(errorManager.INVALID_LOCATION);
    }

    if (cityId) {
      await this.assertCityExists(cityId);
    }

    if (petTypeId) {
      await this.assertPetTypeExists(petTypeId);
    }

    const petTypeInterestsIds = await this.getUserPetTypeInterests(userId);
    const petTypeFilterMode =
      petTypeInterestsIds.length && !isCustomQuery
        ? PetTypeFilterModesEnum.INTERESTS
        : petTypeId
          ? PetTypeFilterModesEnum.CUSTOM
          : PetTypeFilterModesEnum.NONE;

    // Order of location fallbacks: city > country > global
    // Would be better implementing caching given the complexity of the queries & the unnecessary computation for the fallbacks in worst case scenarios

    const baseNeo4jQueryParams = {
      userId,
      ...(petTypeFilterMode === PetTypeFilterModesEnum.INTERESTS && { petTypeInterestsIds }),
      ...(petTypeFilterMode === PetTypeFilterModesEnum.CUSTOM && { petTypeId }),
      limit: int(limit),
      skip: int((page - 1) * limit),
    };

    const { pets: petIds, total } = await this.getPetsInCityWithFallbacks(
      user,
      petTypeFilterMode,
      baseNeo4jQueryParams,
      query,
    );
    const petObjectIds = petIds.map((petId) => new Types.ObjectId(petId));

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          _id: { $in: petObjectIds },
        },
      },
    ];

    const pets = await this.petModel.aggregate([
      ...prePaginationPipeline,
      ...addMaintainOrderStages({ input: petObjectIds }),
      ...getMatchedPetsAggregationPipeline(),
    ]);

    return {
      data: pets,
      page,
      total,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getMatchRequests(userId: string, { page, limit, status, countOnly }: GetMatchRequestsQueryDto) {
    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          receiverUser: new Types.ObjectId(userId),
          status,
        },
      },
    ];

    const [{ total = 0 } = {}] = await this.petMatchModel.aggregate(prePaginationPipeline).count('total');
    if (countOnly) {
      return { data: { totalRequests: total } };
    }

    // TODO: Better be done as post processing against provided limit for performance reasons (if needed)
    // This just fulfills a requirement as is. If performance is an issue, we can do this in post processing.
    const matchRequests = await this.petMatchModel.aggregate([
      ...prePaginationPipeline,
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $group: {
          _id: '$requesterUser',
          doc: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$doc'],
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      ...addPaginationStages({ page, limit }),
      {
        $lookup: {
          from: 'users',
          let: { requesterUser: '$requesterUser' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$requesterUser', null] }],
                },
              },
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                profilePictureMedia: 1,
                username: 1,
                totalPets: 1,
              },
            },
          ],
          as: 'requesterUser',
        },
      },
      {
        $unwind: {
          path: '$requesterUser',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          requesterUser: 1,
          status: 1,
        },
      },
    ]);

    return {
      data: matchRequests,
      page,
      total,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async requestMatch(userId: string, { petId }: RequestMatchDto) {
    const pet = await this.petModel.findOne({ privateId: petId }).lean();

    if (!pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    if (pet.user.userId.toString() === userId) {
      throw new UnprocessableEntityException(errorManager.CANNOT_MATCH_WITH_OWN_PET);
    }

    const [existingMatch, existingPetMatch, oldPetFollow] = await Promise.all([
      this.petMatchModel.findOne({
        requesterUser: userId,
        receiverUser: pet.user.userId,
        status: PetMatchStatusEnum.ACCEPTED,
      }),
      this.petMatchModel.findOne({
        requesterUser: userId,
        receiverUser: pet.user.userId,
        pet: pet._id,
      }),
      this.petFollowModel.exists({ following: pet._id, follower: userId }),
    ]);

    if (existingPetMatch && !existingMatch && existingPetMatch.status !== PetMatchStatusEnum.ACCEPTED) {
      this.logger.warn('Pet match was requested when it already exists', {
        userId,
        petPrivateId: petId,
        petId: pet._id.toString(),
      });
      return; // No need to throw errors for privacy reasons
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const newPetMatch = existingPetMatch || new this.petMatchModel();

      newPetMatch.set({
        requesterUser: userId,
        receiverUser: pet.user.userId,
        pet: pet._id,
        ...(existingMatch && { status: PetMatchStatusEnum.ACCEPTED }),
      });

      await newPetMatch.save({ session });

      if (!oldPetFollow && existingMatch) {
        await this.petFollowCreationHelperService.createPetFollow(
          {
            following: pet._id,
            follower: userId,
          },
          session,
        );
      }

      await session.commitTransaction();

      if (!existingMatch) {
        this.eventEmitter.emit(PetMatchEventsEnum.SEND_REQUESTED_NOTIFICATION, newPetMatch);
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async acceptMatch(userId: string, { matchId }: MatchIdParamDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const match = await this.petMatchModel.findOne({ _id: matchId, receiverUser: userId }).session(session);
      const oldPetFollow = await this.petFollowModel.exists({ following: match.pet, follower: match.requesterUser });

      if (!match) {
        throw new NotFoundException(errorManager.MATCH_REQUEST_NOT_FOUND);
      }

      if (match.status === PetMatchStatusEnum.ACCEPTED) {
        throw new UnprocessableEntityException(errorManager.MATCH_ALREADY_ACCEPTED);
      }

      match.set({
        status: PetMatchStatusEnum.ACCEPTED,
      });

      await match.save({ session });

      if (!oldPetFollow) {
        await this.petFollowCreationHelperService.createPetFollow(
          {
            following: match.pet,
            follower: match.requesterUser,
          },
          session,
        );
      }

      await session.commitTransaction();
      this.eventEmitter.emit(PetMatchEventsEnum.SEND_ACCEPTED_NOTIFICATION, match);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async rejectMatch(userId: string, { matchId }: MatchIdParamDto) {
    const match = await this.petMatchModel.findOne({ _id: matchId, receiverUser: userId });

    if (!match) {
      throw new NotFoundException(errorManager.MATCH_REQUEST_NOT_FOUND);
    }

    if (match.status === PetMatchStatusEnum.ACCEPTED) {
      throw new UnprocessableEntityException(errorManager.MATCH_ALREADY_ACCEPTED);
    }

    await match.deleteDoc();
  }

  private async getPetsInCityWithFallbacks(
    user: User,
    petTypeFilterMode: PetTypeFilterModesEnum,
    baseNeo4jQueryParams: object,
    query: GetMatchesQueryDto,
  ) {
    const { cityId, limit } = query;
    const [petsInCityQuery, petsInCityCountQuery] = this.getMatchesNeo4jQuery({
      petTypeFilterMode,
      locationFilterMode: LocationFilterModesEnum.CITY,
    });

    const cityQueryParams = {
      ...baseNeo4jQueryParams,
      ...(cityId && { cityId }),
      ...(!cityId && { cityId: user.city.toString() }),
    };

    const [petsInCountryRecords, petsInCountryCountRecords] = await Promise.all([
      this.neo4jService.query(petsInCityQuery, cityQueryParams),
      this.neo4jService.query(petsInCityCountQuery, cityQueryParams),
    ]);

    const total = (<Integer>petsInCountryCountRecords?.[0]?.get('total'))?.toNumber() ?? 0;

    // Only fallback if the cityId is not provided in query, so that we don't display data from a fallback when not needed
    if (total < limit * 2 && !cityId) {
      return this.getPetsInCountryWithFallbacks(user, petTypeFilterMode, baseNeo4jQueryParams, query);
    }

    return {
      pets: petsInCountryRecords.map((record) => (<GraphPetNode>record.get('pets').properties).petId),
      total,
    };
  }

  private async getPetsInCountryWithFallbacks(
    user: User,
    petTypeFilterMode: PetTypeFilterModesEnum,
    baseNeo4jQueryParams: object,
    query: GetMatchesQueryDto,
  ) {
    const { limit } = query;
    const [petsInCountryQuery, petsInCountryCountQuery] = this.getMatchesNeo4jQuery({
      petTypeFilterMode,
      locationFilterMode: LocationFilterModesEnum.COUNTRY,
    });

    const countryQueryParams = {
      ...baseNeo4jQueryParams,
      countryId: user.country.toString(),
    };

    const [petsInCountryRecords, petsInCountryCountRecords] = await Promise.all([
      this.neo4jService.query(petsInCountryQuery, countryQueryParams),
      this.neo4jService.query(petsInCountryCountQuery, countryQueryParams),
    ]);

    const total = (<Integer>petsInCountryCountRecords?.[0]?.get('total'))?.toNumber() ?? 0;

    if (total < limit * 2) {
      return this.getPetsInGlobal(petTypeFilterMode, baseNeo4jQueryParams);
    }

    return {
      pets: petsInCountryRecords.map((record) => (<GraphPetNode>record.get('pets').properties).petId),
      total,
    };
  }

  private async getPetsInGlobal(petTypeFilterMode: PetTypeFilterModesEnum, baseNeo4jQueryParams: object) {
    const [petsInGlobalQuery, petsInGlobalCountQuery] = this.getMatchesNeo4jQuery({
      petTypeFilterMode,
      locationFilterMode: LocationFilterModesEnum.GLOBAL,
    });

    const [petsInGlobalRecords, petsInGlobalCountRecords] = await Promise.all([
      this.neo4jService.query(petsInGlobalQuery, baseNeo4jQueryParams),
      this.neo4jService.query(petsInGlobalCountQuery, baseNeo4jQueryParams),
    ]);

    const total = (<Integer>petsInGlobalCountRecords?.[0]?.get('total'))?.toNumber() ?? 0;

    return {
      pets: petsInGlobalRecords.map((record) => (<GraphPetNode>record.get('pets').properties).petId),
      total,
    };
  }

  private async getUserPetTypeInterests(userId: string): Promise<string[]> {
    const userPetTypeInteractionsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.INTERACTED_WITH}]->(pt:${NodeTypesEnum.PET_TYPE})
      RETURN DISTINCT(pt.typeId) AS petTypeId
    `;

    const userPetTypeInteractions = await this.neo4jService.query(userPetTypeInteractionsQuery, {
      userId,
    });

    return userPetTypeInteractions.map((record) => record.get('petTypeId'));
  }

  private getMatchesNeo4jQuery({
    petTypeFilterMode = PetTypeFilterModesEnum.NONE,
    locationFilterMode = LocationFilterModesEnum.GLOBAL,
  }: {
    petTypeFilterMode?: PetTypeFilterModesEnum;
    locationFilterMode?: LocationFilterModesEnum;
  }) {
    const baseQuery = `
        MATCH (me:${NodeTypesEnum.USER} {userId: $userId})
        OPTIONAL MATCH (me)-[:${RelationTypesEnum.FOLLOWS}|${RelationTypesEnum.REQUESTED_MATCH}]->(interactedWithPets:${
          NodeTypesEnum.PET
        })
        WITH me, COLLECT(DISTINCT interactedWithPets.petId) as petInteractionsList
        MATCH (pets:${NodeTypesEnum.PET})
        WHERE NOT pets.petId IN petInteractionsList 
        AND pets.userId <> me.userId 
        AND pets.isPrivate = false
        ${petTypeFilterMode === PetTypeFilterModesEnum.INTERESTS ? `AND pets.petType IN $petTypeInterestsIds` : ''}
        ${petTypeFilterMode === PetTypeFilterModesEnum.CUSTOM ? `AND pets.petType = $petTypeId` : ''}
        ${
          locationFilterMode === LocationFilterModesEnum.CITY
            ? `AND (pets)<-[:${RelationTypesEnum.HAS_PET}]-(:${NodeTypesEnum.USER})-[:${RelationTypesEnum.LIVES_IN_CITY}]->(:${NodeTypesEnum.CITY} {cityId: $cityId})`
            : ''
        }
        ${
          locationFilterMode === LocationFilterModesEnum.COUNTRY
            ? `AND (pets)<-[:${RelationTypesEnum.HAS_PET}]-(:${NodeTypesEnum.USER})-[:${RelationTypesEnum.LIVES_IN_COUNTRY}]->(:${NodeTypesEnum.COUNTRY} {countryId: $countryId})`
            : ''
        }
      `;

    const petsQuery = `
      ${baseQuery}
      RETURN pets
      ORDER BY pets.petId DESC
      SKIP $skip
      LIMIT $limit
    `;

    const countQuery = `
      ${baseQuery}
      RETURN count(pets) as total
    `;

    return [petsQuery, countQuery];
  }

  private async assertCityExists(cityId: string | Types.ObjectId) {
    const city = await this.cityModel.exists({ _id: cityId }).lean();

    if (!city) {
      throw new NotFoundException(errorManager.CITY_NOT_FOUND);
    }
  }

  private async assertPetTypeExists(petTypeId: string | Types.ObjectId) {
    const petType = await this.petTypeModel.exists({ _id: petTypeId }).lean();

    if (!petType) {
      throw new NotFoundException(errorManager.PET_TYPE_NOT_FOUND);
    }
  }
}
