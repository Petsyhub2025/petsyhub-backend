import { Inject, Injectable } from '@nestjs/common';
import {
  BasePaginationQuery,
  GraphPetNode,
  GraphPetTypeNode,
  GraphUserNode,
  IPetModel,
  IUserModel,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
  RelationTypesEnum,
  addMaintainOrderStages,
  getIsPetFollowed,
  getIsUserFollowed,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import * as neo4j from 'neo4j-driver';

@Injectable()
export class DiscoveryService {
  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    private readonly neo4jService: Neo4jService,
  ) {}

  async getRecommendedUsers(userId: string, { page, limit }: BasePaginationQuery) {
    const { users, total } = await this.getSimilarUsers(userId, { page, limit });

    const userIds = users.map((userId) => new Types.ObjectId(userId));

    const populatedUsers = await this.userModel.aggregate([
      {
        $match: {
          _id: {
            $in: userIds,
          },
        },
      },
      {
        $lookup: {
          from: 'countries',
          let: { countryId: '$country' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$countryId', null] }],
                },
              },
            },
            {
              $project: {
                name: 1,
                dialCode: 1,
                countryCode: 1,
              },
            },
          ],
          as: 'country',
        },
      },
      {
        $unwind: {
          path: '$country',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'cities',
          let: { cityId: '$city' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$cityId', null] }],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'city',
        },
      },
      {
        $unwind: {
          path: '$city',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'pets',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$user.userId', '$$userId'] }, { $eq: ['$isPrivate', false] }],
                },
              },
            },
            {
              $sort: {
                _id: -1,
              },
            },
            {
              $limit: 4,
            },
            {
              $project: {
                gender: 1,
                name: 1,
                type: 1,
                breed: 1,
                profilePictureMedia: 1,
              },
            },
          ],
          as: 'pets',
        },
      },
      ...getIsUserFollowed(userId),
      ...addMaintainOrderStages({ input: userIds }),
      {
        $project: {
          bio: 1,
          firstName: 1,
          lastName: 1,
          profilePictureMedia: 1,
          username: 1,
          birthDate: 1,
          gender: 1,
          country: 1,
          city: 1,
          dynamicLink: 1,
          totalPosts: 1,
          totalPets: 1,
          totalFollowers: 1,
          totalUserFollowings: 1,
          totalPetFollowings: 1,
          pets: 1,
          isFollowed: 1,
          isPendingFollow: 1,
          isFollowingMe: 1,
          isUserPendingFollowOnMe: 1,
        },
      },
    ]);

    return {
      data: populatedUsers,
      page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    };
  }

  async getRecommendedPets(userId: string, { page, limit }: BasePaginationQuery) {
    const { pets, total } = await this.getInterestingPets(userId, { page, limit });

    const petIds = pets.map((petId) => new Types.ObjectId(petId));

    const populatedPets = await this.petModel.aggregate([
      {
        $match: {
          _id: {
            $in: petIds,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$user.userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId'],
                },
              },
            },
            ...getIsUserFollowed(userId),
            {
              $project: {
                firstName: 1,
                lastName: 1,
                username: 1,
                isFollowed: 1,
                isPendingFollow: 1,
                isFollowingMe: 1,
                isUserPendingFollowOnMe: 1,
                profilePictureMedia: 1,
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'petbreeds',
          let: { breedId: '$breed' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$breedId'],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'breed',
        },
      },
      {
        $unwind: {
          path: '$breed',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'pettypes',
          let: { typeId: '$type' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$typeId'],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'type',
        },
      },
      {
        $unwind: {
          path: '$type',
          preserveNullAndEmptyArrays: true,
        },
      },
      ...getIsPetFollowed(userId),
      ...addMaintainOrderStages({ input: petIds }),
      {
        $project: {
          bio: 1,
          gender: 1,
          height: 1,
          name: 1,
          type: 1,
          breed: 1,
          birthDate: 1,
          passportNumber: 1,
          weight: 1,
          user: 1,
          totalPosts: 1,
          totalFollowers: 1,
          profilePictureMedia: 1,
          isPrivate: 1,
          isFollowed: 1,
        },
      },
    ]);

    return {
      data: populatedPets,
      page,
      pages: Math.ceil(total / limit),
      total,
      limit,
    };
  }

  private async getSimilarUsers(userId: string, { page, limit }: BasePaginationQuery) {
    const similarityQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u)<-[r:${RelationTypesEnum.USER_SIMILAR}]-(u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN u2
      ORDER BY r.similarity DESC, u2.userId DESC
      SKIP $skip
      LIMIT $limit
    `;

    const similarityCountQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u)<-[r:${RelationTypesEnum.USER_SIMILAR}]-(u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN count(u2) as count
    `;

    const [similarityRecords, similarityCountRecords] = await Promise.all([
      this.neo4jService.query(similarityQuery, {
        userId,
        skip: neo4j.int((page - 1) * limit),
        limit: neo4j.int(limit),
      }),
      this.neo4jService.query(similarityCountQuery, { userId }),
    ]);

    const similarityCount = (<neo4j.Integer>similarityCountRecords?.[0]?.get('count'))?.toNumber() ?? 0;

    if (similarityCount < limit) {
      return this.handleUserCityFallback(userId, { page, limit });
    }

    return {
      users: similarityRecords.map((record) => (<GraphUserNode>record.get('u2').properties).userId),
      total: similarityCount,
    };
  }

  private async handleUserCityFallback(userId: string, { page, limit }: BasePaginationQuery) {
    const usersInCityQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u)-[r:${RelationTypesEnum.LIVES_IN_CITY}]->(:${NodeTypesEnum.CITY})<-[r:${RelationTypesEnum.LIVES_IN_CITY}]-(u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN u2
      ORDER BY datetime(u2.latestActivityDate) DESC, u2.userId DESC
      SKIP $skip
      LIMIT $limit
    `;

    const usersInCityCountQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u)-[r:${RelationTypesEnum.LIVES_IN_CITY}]->(:${NodeTypesEnum.CITY})<-[r:${RelationTypesEnum.LIVES_IN_CITY}]-(u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN count(u2) as count
    `;

    const [usersInCityRecords, usersInCityCountRecords] = await Promise.all([
      this.neo4jService.query(usersInCityQuery, {
        userId,
        skip: neo4j.int((page - 1) * limit),
        limit: neo4j.int(limit),
      }),
      this.neo4jService.query(usersInCityCountQuery, { userId }),
    ]);

    const usersInCityCount = (<neo4j.Integer>usersInCityCountRecords?.[0]?.get('count'))?.toNumber() ?? 0;

    if (usersInCityCount < limit) {
      return this.handleUserCountryFallback(userId, { page, limit });
    }

    return {
      users: usersInCityRecords.map((record) => (<GraphUserNode>record.get('u2').properties).userId),
      total: usersInCityCount,
    };
  }

  private async handleUserCountryFallback(userId: string, { page, limit }: BasePaginationQuery) {
    const usersInCountryQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u)-[r:${RelationTypesEnum.LIVES_IN_COUNTRY}]->(:${NodeTypesEnum.COUNTRY})<-[r:${RelationTypesEnum.LIVES_IN_COUNTRY}]-(u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN u2
      ORDER BY datetime(u2.latestActivityDate) DESC, u2.userId DESC
      SKIP $skip
      LIMIT $limit
    `;

    const usersInCountryCountQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u)-[r:${RelationTypesEnum.LIVES_IN_COUNTRY}]->(:${NodeTypesEnum.COUNTRY})<-[r:${RelationTypesEnum.LIVES_IN_COUNTRY}]-(u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN count(u2) as count
    `;

    const [usersInCountryRecords, usersInCountryCountRecords] = await Promise.all([
      this.neo4jService.query(usersInCountryQuery, {
        userId,
        skip: neo4j.int((page - 1) * limit),
        limit: neo4j.int(limit),
      }),
      this.neo4jService.query(usersInCountryCountQuery, { userId }),
    ]);

    const usersInCountryCount = (<neo4j.Integer>usersInCountryCountRecords?.[0]?.get('count'))?.toNumber() ?? 0;

    if (usersInCountryCount < limit) {
      return this.handleAllUsersFallback(userId, { page, limit });
    }

    return {
      users: usersInCountryRecords.map((record) => (<GraphUserNode>record.get('u2').properties).userId),
      total: usersInCountryCount,
    };
  }

  private async handleAllUsersFallback(userId: string, { page, limit }: BasePaginationQuery) {
    const allUsersQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN u2
      ORDER BY datetime(u2.latestActivityDate) DESC, u2.userId DESC
      SKIP $skip
      LIMIT $limit
    `;

    const allUsersCountQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(followings:${NodeTypesEnum.USER})
      WITH u, collect(followings.userId) as followingsList
      MATCH (u2:${NodeTypesEnum.USER})
      WHERE NOT u2.userId IN followingsList AND u.userId <> u2.userId AND u2.isPrivate = false
      RETURN count(u2) as count
    `;

    const [allUsersRecords, allUsersCountRecords] = await Promise.all([
      this.neo4jService.query(allUsersQuery, {
        userId,
        skip: neo4j.int((page - 1) * limit),
        limit: neo4j.int(limit),
      }),
      this.neo4jService.query(allUsersCountQuery, { userId }),
    ]);

    const allUsersCount = (<neo4j.Integer>allUsersCountRecords?.[0]?.get('count'))?.toNumber() ?? 0;

    return {
      users: allUsersRecords.map((record) => (<GraphUserNode>record.get('u2').properties).userId),
      total: allUsersCount,
    };
  }

  private async getInterestingPets(userId: string, { page, limit }: BasePaginationQuery) {
    const petTypeInteractionsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.INTERACTED_WITH}]->(petTypes:${NodeTypesEnum.PET_TYPE})
      RETURN count(r) as interactionsCount, petTypes
    `;

    const interactionsCountRecords = await this.neo4jService.query(petTypeInteractionsQuery, { userId });

    const petTypeIds: string[] = [];
    const interestingPetQueries: { query: string; params: object }[] = [];
    let totalInteractionsCount = 0;
    interactionsCountRecords.forEach((record) => {
      const petTypeId = (<GraphPetTypeNode>record.get('petTypes').properties).typeId;
      const interactionsCount = (<neo4j.Integer>record.get('interactionsCount'))?.toNumber() ?? 0;
      const petQuery = `
        MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
        OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(petFollowings:${NodeTypesEnum.PET})
        WITH u, collect(petFollowings.petId) as petFollowingsList
        MATCH (pets:${NodeTypesEnum.PET})-[r:${RelationTypesEnum.IS_PET_TYPE}]->(:${NodeTypesEnum.PET_TYPE} {typeId: $petTypeId})
        WHERE NOT pets.petId IN petFollowingsList AND pets.userId <> u.userId AND pets.isPrivate = false
        RETURN pets
        ORDER BY pets.petId DESC
        LIMIT $interactionsCount
      `;
      totalInteractionsCount += interactionsCount;
      petTypeIds.push(petTypeId);
      interestingPetQueries.push({
        query: petQuery,
        params: {
          userId,
          petTypeId,
          interactionsCount: neo4j.int(interactionsCount),
        },
      });
    });

    if (totalInteractionsCount < limit) {
      return this.handleAllPetsFallback(userId, { page, limit });
    }

    if (page === 1) await this.generatePetRecommendations(userId, interestingPetQueries);

    const fetchRecommendedPetsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.RECOMMENDED_PET}]->(pet:${NodeTypesEnum.PET})
      RETURN pet
      ORDER BY elementId(r) DESC
      SKIP $skip
      LIMIT $limit
    `;

    const fetchRecommendedPetsCountQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.RECOMMENDED_PET}]->(pet:${NodeTypesEnum.PET})
      RETURN count(pet) as count
    `;

    const [recommendedPetsRecords, recommendedPetsCountRecords] = await Promise.all([
      this.neo4jService.query(fetchRecommendedPetsQuery, {
        userId,
        skip: neo4j.int((page - 1) * limit),
        limit: neo4j.int(limit),
      }),
      this.neo4jService.query(fetchRecommendedPetsCountQuery, { userId }),
    ]);

    const recommendedPetsCount = (<neo4j.Integer>recommendedPetsCountRecords?.[0]?.get('count'))?.toNumber() ?? 0;

    return {
      pets: recommendedPetsRecords.map((record) => (<GraphPetNode>record.get('pet').properties).petId),
      total: recommendedPetsCount,
    };
  }

  private async generatePetRecommendations(
    userId: string,
    interestingPetsQueries: { query: string; params: object }[],
  ) {
    const interestingPetsRecords = await Promise.all(
      interestingPetsQueries.map(({ query, params }) => this.neo4jService.query(query, params)),
    );

    const petIds = interestingPetsRecords.reduce<string[]>((acc, records) => {
      return acc.concat(records.map((record) => (<GraphPetNode>record.get('pets').properties).petId));
    }, []);

    // Shuffle using Fisher-Yates algorithm
    for (let i = petIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [petIds[i], petIds[j]] = [petIds[j], petIds[i]];
    }

    const deleteQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.RECOMMENDED_PET}]->()
      DELETE r
    `;

    await this.neo4jService.query(deleteQuery, { userId });

    const createQuery = `
      UNWIND $petIds as petId
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      MATCH (pet:${NodeTypesEnum.PET} {petId: petId})
      MERGE (u)-[r:${RelationTypesEnum.RECOMMENDED_PET}]->(pet)
    `;

    await this.neo4jService.query(createQuery, { userId, petIds });
  }

  private async handleAllPetsFallback(userId: string, { page, limit }: BasePaginationQuery) {
    const allPetsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(petFollowings:${NodeTypesEnum.PET})
      WITH u, collect(petFollowings.petId) as petFollowingsList
      MATCH (pets:${NodeTypesEnum.PET})
      WHERE NOT pets.petId IN petFollowingsList AND pets.userId <> u.userId AND pets.isPrivate = false
      RETURN pets
      ORDER BY pets.petId DESC
      SKIP $skip
      LIMIT $limit
    `;

    const allPetsCountQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      OPTIONAL MATCH (u)-[:${RelationTypesEnum.FOLLOWS}]->(petFollowings:${NodeTypesEnum.PET})
      WITH u, collect(petFollowings.petId) as petFollowingsList
      MATCH (pets:${NodeTypesEnum.PET})
      WHERE NOT pets.petId IN petFollowingsList AND pets.userId <> u.userId
      RETURN count(pets) as count
    `;

    const [allPetsRecords, allPetsCountRecords] = await Promise.all([
      this.neo4jService.query(allPetsQuery, {
        userId,
        skip: neo4j.int((page - 1) * limit),
        limit: neo4j.int(limit),
      }),
      this.neo4jService.query(allPetsCountQuery, { userId }),
    ]);

    const allPetsCount = (<neo4j.Integer>allPetsCountRecords?.[0]?.get('count'))?.toNumber() ?? 0;

    return {
      pets: allPetsRecords.map((record) => (<GraphPetNode>record.get('pets').properties).petId),
      total: allPetsCount,
    };
  }
}
