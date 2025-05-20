import {
  AggregationPipelineBuilder,
  CustomLoggerService,
  IPetFollowModel,
  IPetModel,
  IPostModel,
  ITopicModel,
  IUserFollowModel,
  IUserModel,
  IUserTopicModel,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
  Pet,
  PetFollowHelperService,
  Post,
  PostEventsEnum,
  RelationTypesEnum,
  User,
  UserBlockHelperService,
  UserFollowHelperService,
} from '@instapets-backend/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PostIdParamDto } from '@posts/shared-module/dto/post-id-param.dto';
import { addPaginationStages } from '@posts/shared/aggregation-helpers/aggregation-helpers';
import { errorManager } from '@posts/user/shared/config/error-manager.config';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { HydratedDocument, PipelineStage, Types } from 'mongoose';
import { int } from 'neo4j-driver';
import { getPostAggregationPipeline } from './aggregations/get-post.aggregation';
import { getPostsAggregationPipeline } from './aggregations/get-posts.aggregation';
import { getTaggedUsersAndPetsPipeline } from './aggregations/get-tagged-users-pets.aggregation';
import { CreatePostDto } from './dto/create-post.dto';
import { GetAllPostImagesQueryDto } from './dto/get-all-post-images.dto';
import { GetExplorePostsQueryDto } from './dto/get-explore-posts.dto';
import { GetPostsQueryDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PostsService {
  constructor(
    @Inject(ModelNames.POST) private postModel: IPostModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.USER_FOLLOW) private userFollowModel: IUserFollowModel,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
    @Inject(ModelNames.USER_TOPIC) private userTopicModel: IUserTopicModel,
    @Inject(ModelNames.TOPIC) private readonly topicModel: ITopicModel,
    private readonly petFollowHelperService: PetFollowHelperService,
    private readonly userFollowHelperService: UserFollowHelperService,
    private readonly userBlockHelperService: UserBlockHelperService,
    private readonly neo4jService: Neo4jService,
    private readonly logger: CustomLoggerService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getPosts(userId: string, query: GetPostsQueryDto) {
    const { city, country, petId, taggedPets, taggedUsers, userId: queryUserId, page, limit } = query;

    const [user, pet] = await Promise.all([
      this.userModel.findOne({
        ...(queryUserId && { _id: queryUserId }),
        ...(userId && !queryUserId && { _id: userId }),
        isViewable: true,
      }),
      ...(petId
        ? [
            this.petModel.findOne({
              _id: petId,
              isViewable: true,
            }),
          ]
        : []),
    ]);

    if (petId && !pet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      queryUserId || pet?.user?.userId?.toString(),
    );

    if (areUsersMutuallyOrPartiallyBlocked) {
      throw new BadRequestException(errorManager.USER_NOT_FOUND);
    }

    const isPetOwnedByUser = !queryUserId && petId && pet?.user?.userId?.toString() === userId;

    if (
      (petId && !isPetOwnedByUser && !(await this.petFollowHelperService.canUserViewPetContent(pet, userId))) ||
      (queryUserId && !(await this.userFollowHelperService.canUserViewUserContent(user, userId)))
    ) {
      return {
        data: [],
        page,
        limit,
        total: 0,
        pages: 0,
      };
    }

    const prePaginationPipeline = [
      {
        $match: {
          ...(!queryUserId && !petId && { authorUser: new Types.ObjectId(userId) }),
          ...(queryUserId && {
            authorUser: new Types.ObjectId(queryUserId),
            $or: [
              {
                isPrivate: false,
                hasAllowedUsers: false,
              },
              {
                allowedUsers: {
                  $in: [new Types.ObjectId(userId)],
                },
              },
            ],
          }),
          ...(petId &&
            !isPetOwnedByUser && {
              authorPet: new Types.ObjectId(petId),
              $or: [
                {
                  isPrivate: false,
                  hasAllowedUsers: false,
                },
                {
                  allowedUsers: {
                    $in: [new Types.ObjectId(userId)],
                  },
                },
              ],
            }),
          ...(petId && isPetOwnedByUser && { authorPet: new Types.ObjectId(petId) }),
          ...(taggedUsers && {
            taggedUsers: { $in: taggedUsers.map((taggedUser) => new Types.ObjectId(taggedUser)) },
          }),
          ...(taggedPets && { taggedPets: { $in: taggedPets.map((taggedPet) => new Types.ObjectId(taggedPet)) } }),
          ...(city && { 'checkInLocation.city': new Types.ObjectId(city) }),
          ...(country && { 'checkInLocation.country': new Types.ObjectId(country) }),
          isViewable: true,
        },
      },
    ];

    const [posts, [{ total = 0 } = { total: 0 }]] = await Promise.all([
      this.postModel.aggregate([
        ...prePaginationPipeline,
        { $sort: { createdAt: -1 } },
        ...addPaginationStages({ limit, page }),
        ...getPostsAggregationPipeline(userId),
      ]),
      this.postModel.aggregate([...prePaginationPipeline, { $count: 'total' }]),
    ]);

    return {
      data: posts,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async getAllPostImages(userId: string, { petId, page, limit }: GetAllPostImagesQueryDto) {
    if (petId) {
      const petExists = await this.petModel.exists({
        _id: new Types.ObjectId(petId),
        'user.userId': new Types.ObjectId(userId),
        isViewable: true,
      });

      if (!petExists) {
        throw new NotFoundException(errorManager.PET_NOT_FOUND);
      }
    }

    const prePaginationPipeline: PipelineStage[] = [
      {
        $match: {
          ...(!petId && { authorUser: new Types.ObjectId(userId) }),
          ...(petId && { authorPet: new Types.ObjectId(petId) }),
          isViewable: true,
        },
      },
    ];

    const [posts, [{ total = 0 } = {}]] = await Promise.all([
      this.postModel.aggregate([
        ...prePaginationPipeline,
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $addFields: {
            media: {
              $filter: {
                input: '$media',
                as: 'media',
                cond: {
                  $eq: ['$$media.type', MediaTypeEnum.IMAGE],
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: '$media',
            preserveNullAndEmptyArrays: false,
          },
        },
        ...addPaginationStages({ limit, page }),
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ url: '$media.url' }],
            },
          },
        },
      ]),
      this.postModel.aggregate([...prePaginationPipeline]).count('total'),
    ]);

    return {
      data: posts,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getPostById(userId: string, { postId }: PostIdParamDto) {
    const post = await this.postModel
      .findOne({
        _id: new Types.ObjectId(postId),
        isViewable: true,
      })
      .populate<{ authorUser: HydratedDocument<User>; authorPet: HydratedDocument<Pet> }>([
        {
          path: 'authorUser',
          select: {
            _id: 1,
            isPrivate: 1,
          },
        },
        {
          path: 'authorPet',
          select: {
            _id: 1,
            user: 1,
          },
        },
      ]);

    if (!post) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    if (!post.authorUser && !post.authorPet) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    const isPetOwnedByUser = post.authorPet && post.authorPet?.user?.userId?.toString() === userId;
    const isPostOwnedByUser = post.authorUser && post.authorUser?._id?.toString() === userId;

    const areUsersMutuallyOrPartiallyBlocked = await this.userBlockHelperService.areUsersMutuallyOrPartiallyBlocked(
      userId,
      post.authorUser?._id?.toString() || post.authorPet?.user?.userId?.toString(),
    );

    if (
      areUsersMutuallyOrPartiallyBlocked ||
      (post.isPrivate && !isPetOwnedByUser && !isPostOwnedByUser) ||
      (post.hasAllowedUsers && !post.allowedUsers?.some((allowedUser) => allowedUser.toString() === userId)) ||
      (post.authorPet &&
        !isPetOwnedByUser &&
        !(await this.petFollowHelperService.canUserViewPetContent(post.authorPet, userId))) ||
      (post.authorUser &&
        !isPostOwnedByUser &&
        !(await this.userFollowHelperService.canUserViewUserContent(post.authorUser, userId)))
    ) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    const pipeline = [
      {
        $match: {
          _id: new Types.ObjectId(postId),
        },
      },
      ...getPostAggregationPipeline(userId),
    ];

    const [populatedPost] = await this.postModel.aggregate(pipeline);

    return populatedPost;
  }

  async getExplorePosts(userId: string, { afterId, limit }: GetExplorePostsQueryDto) {
    if (afterId == undefined) await this.generateExplorePosts(userId);

    const explorePostsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.EXPLORE_POST}]->(post:${
        NodeTypesEnum.POST
      })
      ${afterId != undefined ? `WHERE r.order > $afterId` : ''}
      RETURN post.postId AS postId, r.order AS order
      ORDER BY r.order ASC
      LIMIT $limit
    `;

    const explorePostsRecords = await this.neo4jService.query(explorePostsQuery, {
      userId,
      ...(afterId != undefined && { afterId: int(afterId) }),
      limit: int(limit),
    });
    const explorePosts = explorePostsRecords.map((record) => ({
      postId: record.get('postId'),
      order: record.get('order'),
    }));
    const explorePostIds = explorePosts.map((post) => new Types.ObjectId(post.postId));
    const indexedPostOrder = explorePosts.reduce<{ [key: string]: number }>((acc, post) => {
      acc[post.postId] = post.order;
      return acc;
    }, {});

    const prePaginationPipeline = [
      {
        $match: {
          _id: {
            $in: explorePostIds,
          },
        },
      },
    ];

    const pipeline = new AggregationPipelineBuilder()
      .addStages(...prePaginationPipeline)
      .addMaintainOrderStages({ input: explorePostIds })
      .addStages(...getPostsAggregationPipeline(userId))
      .build();

    const posts = await this.postModel.aggregate(pipeline);

    return {
      data: posts.map((post) => ({ ...post, exploreId: indexedPostOrder[post._id.toString()] })),
      limit,
    };
  }

  private hasDuplicates(topics: string[]) {
    return new Set(topics).size !== topics.length;
  }

  async createPost(userId: string, body: CreatePostDto) {
    const { postAsPetId, mediaUploads, taggedUsers, taggedPets, topics, ...restOfBody } = body;

    const [user, postAsPet] = await Promise.all([
      this.userModel.findById(userId),
      this.petModel.findOne({
        _id: new Types.ObjectId(postAsPetId),
        'user.userId': new Types.ObjectId(userId),
      }),
    ]);

    if (!user) {
      throw new NotFoundException(errorManager.USER_NOT_FOUND);
    }

    if (postAsPetId && !postAsPet) {
      throw new NotFoundException(errorManager.PET_NOT_FOUND);
    }

    // Check duplications in topics ids
    if (this.hasDuplicates(topics.map((topic) => String(topic)))) {
      throw new BadRequestException(errorManager.TOPICS_DUPLICATED);
    }

    // Check topics existence
    for (let i = 0; i < topics.length; i++) {
      if (!(await this.topicModel.findById(topics[i]))) {
        throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
      }
    }

    // Check topics existence in user topics
    for (let i = 0; i < topics.length; i++) {
      if (
        !(await this.userTopicModel.findOne({ user: new Types.ObjectId(userId), topic: new Types.ObjectId(topics[i]) }))
      ) {
        throw new NotFoundException(errorManager.TOPIC_NOT_FOUND);
      }
    }

    const newPost = new this.postModel({
      ...restOfBody,
      ...(postAsPetId && {
        authorPet: new Types.ObjectId(postAsPetId),
        authorPetOwnedByUser: new Types.ObjectId(userId),
      }),
      ...(!postAsPetId && { authorUser: new Types.ObjectId(userId) }),
      topics: topics.map((topic) => new Types.ObjectId(topic)),
    });

    if (taggedUsers?.length) {
      await this.assertTaggedUsersExist(userId, taggedUsers);

      newPost.set({
        taggedUsers: taggedUsers.map((taggedUser) => new Types.ObjectId(taggedUser)),
      });
    }

    if (taggedPets?.length) {
      await this.assertTaggedPetsExist(userId, taggedPets);

      newPost.set({
        taggedPets: taggedPets.map((taggedPet) => new Types.ObjectId(taggedPet)),
      });
    }

    const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
      files: mediaUploads,
      filesS3PathPrefix: `${userId}/posts`,
      resourceModel: {
        name: UploadModelResources.POSTS,
      },
      allowedMediaTypes: [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO],
    });

    newPost.set({
      media,
      mediaProcessingId,
    });

    const savedPost = await newPost.save();

    this.eventEmitter.emit(PostEventsEnum.USER_TAG_NOTIFICATION, savedPost);
    this.eventEmitter.emit(PostEventsEnum.PET_TAG_NOTIFICATION, savedPost);

    const [post] = await this.postModel.aggregate([
      {
        $match: {
          _id: newPost._id,
        },
      },
      ...getPostsAggregationPipeline(userId),
    ]);

    return post;
  }

  async updatePost(userId: string, { postId }: PostIdParamDto, body: UpdatePostDto) {
    const { allowedUsers, isPrivate, mediaUploads, taggedPets, taggedUsers } = body;

    const [oldPost, userPets] = await Promise.all([
      this.postModel.findOne({
        _id: new Types.ObjectId(postId),
        isViewable: true,
      }),
      this.petModel
        .find({ 'user.userId': new Types.ObjectId(userId), isViewable: true })
        .select('_id')
        .lean(),
    ]);

    if (
      !oldPost ||
      (oldPost.authorPet && !userPets?.some((pet) => pet._id.toString() === oldPost.authorPet.toString())) ||
      (oldPost.authorUser && oldPost.authorUser?.toString() !== userId)
    ) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    const setQuery: Partial<Post> = {
      ...body,
      ...(oldPost?.topics?.length > 0 ? { topics: oldPost?.topics } : { topics: [] }),
    };

    if (mediaUploads?.length) {
      const { media } = await this.mediaUploadService.handleMediaUploads({
        files: mediaUploads,
        filesS3PathPrefix: `${userId}/posts`,
        resourceModel: {
          name: UploadModelResources.POSTS,
          mediaProcessingId: oldPost.mediaProcessingId,
        },
        allowedMediaTypes: [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO],
      });

      setQuery.media = media;
    }

    if (allowedUsers?.length && isPrivate === undefined) {
      setQuery.isPrivate = false;
    }

    if (isPrivate) {
      setQuery.allowedUsers = [];
    }

    if (taggedUsers?.length) {
      await this.assertTaggedUsersExist(userId, taggedUsers);

      setQuery.taggedUsers = taggedUsers.map((taggedUser) => new Types.ObjectId(taggedUser));
    }

    if (taggedPets?.length) {
      await this.assertTaggedPetsExist(userId, taggedPets);

      setQuery.taggedPets = taggedPets.map((taggedPet) => new Types.ObjectId(taggedPet));
    }

    oldPost.set(setQuery);
    await oldPost.save();

    const [post] = await this.postModel.aggregate([
      {
        $match: {
          _id: oldPost._id,
        },
      },
      ...getPostsAggregationPipeline(userId),
    ]);

    return post;
  }

  async deletePost(userId: string, { postId }: PostIdParamDto) {
    const post = await this.postModel.findOne({
      _id: new Types.ObjectId(postId),
      isViewable: true,
    });

    const authorPet = await this.petModel.findOne({
      _id: post?.authorPet,
      'user.userId': new Types.ObjectId(userId),
    });

    if (
      !post ||
      (post.authorPet && !authorPet) ||
      (post.authorPet && authorPet?.user?.userId?.toString() !== userId) ||
      (post.authorUser && post.authorUser?.toString() !== userId)
    ) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    await post.deleteDoc();
  }

  async getTaggedUsersAndPets(userId: string, { postId }: PostIdParamDto) {
    const [tagged] = await this.postModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(postId),
          isViewable: true,
        },
      },
      ...getTaggedUsersAndPetsPipeline(userId, true),
    ]);

    if (!tagged) {
      throw new NotFoundException(errorManager.POST_NOT_FOUND);
    }

    return tagged;
  }

  private async generateExplorePosts(userId: string) {
    try {
      const explorePostsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})
      MATCH (post:${NodeTypesEnum.POST})<-[:${RelationTypesEnum.POSTED}]-(poster)
      WHERE (post.isPrivate = false AND post.hasAllowedUsers = false AND poster.isPrivate = false)
      OR (post.hasAllowedUsers = true AND (u)-[:${RelationTypesEnum.ALLOWED_TO_VIEW}]->(post))
      RETURN post.postId AS postId
      ORDER BY post.postDegreeScore DESC, post.postId DESC
      LIMIT 1000
    `;

      const explorePostsRecords = await this.neo4jService.query(explorePostsQuery, { userId });

      const explorePostIds = explorePostsRecords.map((record) => record.get('postId'));

      // Randomize post ids using Fisher-Yates shuffle algorithm
      for (let i = explorePostIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [explorePostIds[i], explorePostIds[j]] = [explorePostIds[j], explorePostIds[i]];
      }

      const explorePostRelations = explorePostIds.map<{ order: number; viewerId: string; postId: string }>(
        (postId, i) => ({
          order: i,
          viewerId: userId,
          postId,
        }),
      );

      const deleteQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.EXPLORE_POST}]->(:${NodeTypesEnum.POST})
      DELETE r
    `;

      await this.neo4jService.query(deleteQuery, { userId });

      const createQuery = `
      UNWIND $explorePostRelations AS relation
      MATCH (u:${NodeTypesEnum.USER} {userId: relation.viewerId})
      MATCH (post:${NodeTypesEnum.POST} {postId: relation.postId})
      CREATE (u)-[:${RelationTypesEnum.EXPLORE_POST} {order: relation.order}]->(post)
    `;

      await this.neo4jService.query(createQuery, { explorePostRelations });
    } catch (error) {
      this.logger.error(`Could not generate explore posts for user ${userId}: ${error?.message}`, { error });
      throw new InternalServerErrorException(errorManager.COULD_NOT_GENERATE_EXPLORE_POSTS);
    }
  }

  private async assertTaggedUsersExist(userId: string, taggedUsers: Array<string | Types.ObjectId>) {
    const set = new Set(taggedUsers.map((objectId) => objectId.toString()));

    if (set.size !== taggedUsers.length) {
      throw new UnprocessableEntityException(errorManager.TAGGED_USERS_DUPLICATED);
    }

    const isSelfTagged = taggedUsers.some((objectId) => objectId.toString() === userId);

    if (isSelfTagged) {
      throw new UnprocessableEntityException(errorManager.TAGGED_USERS_SELF_TAGGED);
    }

    const taggedUsersCount = await this.userModel.countDocuments({
      _id: {
        $in: taggedUsers.map((objectId) => new Types.ObjectId(objectId)),
      },
    });

    if (taggedUsersCount !== taggedUsers.length) {
      throw new NotFoundException(errorManager.TAGGED_USERS_NOT_FOUND);
    }

    const userFollows = await this.userFollowModel.countDocuments({
      follower: new Types.ObjectId(userId),
      following: {
        $in: taggedUsers.map((objectId) => new Types.ObjectId(objectId)),
      },
    });

    if (userFollows !== taggedUsers.length) {
      throw new UnprocessableEntityException(errorManager.CANNOT_TAG_NON_FOLLOWED_USERS);
    }
  }

  private async assertTaggedPetsExist(userId: string, taggedPets: Array<string | Types.ObjectId>) {
    const set = new Set(taggedPets.map((objectId) => objectId.toString()));

    if (set.size !== taggedPets.length) {
      throw new UnprocessableEntityException(errorManager.TAGGED_PETS_DUPLICATED);
    }

    const taggedPetsCount = await this.petModel.countDocuments({
      _id: {
        $in: taggedPets.map((objectId) => new Types.ObjectId(objectId)),
      },
    });

    if (taggedPetsCount !== taggedPets.length) {
      throw new NotFoundException(errorManager.TAGGED_PETS_NOT_FOUND);
    }

    const [followedPetsCount, ownedPetsCount] = await Promise.all([
      this.petFollowModel.countDocuments({
        follower: new Types.ObjectId(userId),
        following: {
          $in: taggedPets.map((objectId) => new Types.ObjectId(objectId)),
        },
      }),
      this.petModel.countDocuments({
        _id: {
          $in: taggedPets.map((objectId) => new Types.ObjectId(objectId)),
        },
        'user.userId': new Types.ObjectId(userId),
      }),
    ]);

    if (followedPetsCount + ownedPetsCount !== taggedPets.length) {
      throw new UnprocessableEntityException(errorManager.CANNOT_TAG_NON_FOLLOWED_OR_OWNED_PETS);
    }
  }
}
