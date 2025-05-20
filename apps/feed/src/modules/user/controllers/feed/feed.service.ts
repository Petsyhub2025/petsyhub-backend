import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import { getPostsAggregationPipeline } from '@feed/user/shared/aggregations/get-posts.aggregation';
import {
  MAX_FEED_UPSERT_RETRIES,
  MAX_FEED_UPSERT_RETRIES_INTERVAL,
  includedUserRelations,
} from '@feed/user/shared/constants';
import { parseRawPostNode } from '@feed/user/shared/helpers/content-parser.helper';
import { EnrichFeedService } from '@feed/user/shared/helpers/enrichment/enrich-feed.service';
import { parseRelation } from '@feed/user/shared/helpers/relation-parser.helper';
import {
  CustomLoggerService,
  GraphContentDto,
  GraphFeedNode,
  GraphPostNode,
  IPostModel,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
  Post,
  RelationTypesEnum,
  UserJwtPersona,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';
import { Node, Record, int as neo4jInt } from 'neo4j-driver';
import { from, lastValueFrom, retry, timer } from 'rxjs';
import { GetFeedQueryDto } from './dto/get-feed.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly enrichFeedService: EnrichFeedService,
    private readonly logger: CustomLoggerService,
    @Inject(ModelNames.POST) private postModel: IPostModel,
  ) {}

  async getFeed(user: UserJwtPersona, query: GetFeedQueryDto): Promise<{ feed: Node[]; isInjectionRound: boolean }> {
    const { afterId } = query;
    const { limit } = query;

    // const visibilityRoll = new DiceRoll('d%').total;
    // const probabilityOfAppearance = 35; // 35% chance of appearance
    // const visibility = visibilityRoll < probabilityOfAppearance;

    // if (visibility) limit = limit - 1;

    if (afterId == undefined) await this.generateFeed(user);

    // Cypher query to get all feed for specific user ordering by id and using cursor pagination
    const feedQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.HAS_FEED}]->(f:Feed)
      ${afterId != undefined ? 'WHERE f.feedOrder > $afterId ' : ''}
      RETURN f
      ORDER BY f.feedOrder ASC
      LIMIT $limit
    `;

    const feedRecords = await this.neo4jService.query(feedQuery, {
      userId: user._id,
      limit: neo4jInt(limit),
      afterId: afterId != undefined ? neo4jInt(afterId) : null,
    });

    return {
      feed: feedRecords.map((record: any) => record.get('f')),
      // isInjectionRound: visibility,
      isInjectionRound: false,
    };
  }

  async enrichFeed(feed: Node[], user: UserJwtPersona) {
    // Pre-process posts in feed to send them to post population aggregation function to avoid duplicate calls
    const postIds: Types.ObjectId[] = [];
    const mappedFeed: GraphFeedNode[] = feed.map((feedItem) => {
      const mappedFeedItem = feedItem.properties as GraphFeedNode;

      // any is used as they are pre-processed as strings and saved in neo4j that way, due to neo4j not supporting objects as types
      mappedFeedItem.action = JSON.parse(mappedFeedItem.action as any);
      mappedFeedItem.content = JSON.parse(mappedFeedItem.content as any);

      if (mappedFeedItem.content.type === NodeTypesEnum.POST) {
        postIds.push(new Types.ObjectId((mappedFeedItem.content as GraphPostNode).postId));
      }

      return mappedFeedItem;
    });

    const populatedPosts = await this.postModel.aggregate([
      {
        $match: {
          _id: { $in: postIds },
        },
      },
      ...getPostsAggregationPipeline(user._id),
    ]);

    mappedFeed.forEach((feedItem) => {
      if (feedItem.content.type === NodeTypesEnum.POST) {
        const post = populatedPosts.find(
          (post: HydratedDocument<Post>) => post._id.toString() === (feedItem.content as GraphPostNode).postId,
        );

        // This step is required to post-process the population into a GraphContentDto
        // So that we don't need to re-populate in the enrichment phase again
        feedItem.content = {} as any;
        if (post) {
          (feedItem.content as GraphContentDto).post = post;
          (feedItem.content as GraphContentDto).type = NodeTypesEnum.POST;
        }
      }
    });

    const isLikedByFollowingQuery = `
      UNWIND $postIds AS postId
      MATCH (p:${NodeTypesEnum.POST} {postId: postId})
      CALL {
        WITH p
        MATCH (me:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.FOLLOWS}]->(u:${NodeTypesEnum.USER})-[r2:${RelationTypesEnum.LIKED}]->(p)
        RETURN u.userId AS userId
        ORDER BY r2.createdAt DESC
        LIMIT 1
      }
      RETURN postId, userId
    `;

    const isLikedByFollowingRecords = await this.neo4jService.query(isLikedByFollowingQuery, {
      userId: user._id,
      postIds: postIds.map((id) => id.toString()),
    });

    const likedByFollowing = isLikedByFollowingRecords.reduce<{
      [key: string]: string;
    }>((acc: any, record: Record) => {
      acc[record.get('postId')] = record.get('userId');
      return acc;
    }, {});

    const enrichedFeed = await this.enrichFeedService.enrichFeed(mappedFeed, user._id, likedByFollowing);

    // const enrichedFeed = populatedFeed.map((feedItem) => {
    //   const enrichedFeedItem = feedItem;

    //   if (enrichedFeedItem.content.type === NodeTypesEnum.POST) {
    //     const post = enrichedFeedItem.content.post;

    //     enrichedFeedItem.content = {
    //       ...enrichedFeedItem.content,
    //       post: {
    //         ...post,
    //         likedByFollowing: isLikedByFollowing[post._id.toString()],
    //       } as HydratedDocument<Post> & { likedByFollowing: LikedByFollowingUser },
    //     };
    //   }

    //   return enrichedFeedItem;
    // });

    return enrichedFeed;
  }

  private async generateFeed(user: UserJwtPersona) {
    const { rawFeed } = await this.getRawGraphFeed(user._id);

    // eslint-disable-next-line no-console
    console.log('raw feed ', rawFeed);

    const uniqueFeed = this.generateUniqueFeed(rawFeed);

    await this.upsertGraphFeed(uniqueFeed, user._id);
  }

  private async getRawGraphFeed(userId: string) {
    const userContentQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[posted:${RelationTypesEnum.POSTED}]->(everything:${NodeTypesEnum.POST})
      RETURN u, posted, type(posted) AS relationLabel, everything
      ORDER BY posted.createdAt DESC
      LIMIT 125
    `;

    const userPetsContentQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[:${RelationTypesEnum.HAS_PET}]->(pet)-[posted:${RelationTypesEnum.POSTED}]->(everything:${NodeTypesEnum.POST})
      RETURN u, pet, posted, type(posted) AS relationLabel, everything
      ORDER BY posted.createdAt DESC
      LIMIT 125
    `;

    const userFollowsContentQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[follows:FOLLOWS]->(following:${NodeTypesEnum.USER})
      CALL {
        WITH u, following
        MATCH (following)-[relatedTo]->(everything:${NodeTypesEnum.POST})
        WHERE relatedTo.relationType IN [
          ${includedUserRelations} 
        ] AND ((everything.isPrivate = false AND everything.hasAllowedUsers = false) OR (everything.hasAllowedUsers = true AND (u)-[:${RelationTypesEnum.ALLOWED_TO_VIEW}]->(everything)))
        RETURN relatedTo, type(relatedTo) AS relationLabel, everything
        ORDER BY relatedTo.createdAt DESC
        LIMIT 10
      }
      RETURN following, relatedTo, relationLabel, everything
      LIMIT 500
    `;

    const petFollowsContentQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[follows:FOLLOWS]->(following:${NodeTypesEnum.PET})
      CALL {
        WITH u, following
        MATCH (following)-[posted:${RelationTypesEnum.POSTED}]->(everything:${NodeTypesEnum.POST})
        WHERE ((everything.isPrivate = false AND everything.hasAllowedUsers = false) OR (everything.hasAllowedUsers = true AND (u)-[:${RelationTypesEnum.ALLOWED_TO_VIEW}]->(everything)))
        RETURN posted, type(posted) AS relationLabel, everything
        ORDER BY posted.createdAt DESC
        LIMIT 10
      }
      RETURN following, posted, relationLabel, everything
      LIMIT 250
    `;

    const userTopicsContentQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[has_interest:${RelationTypesEnum.HAS_INTEREST}]->(t:${NodeTypesEnum.TOPIC})<-[has_topic:${RelationTypesEnum.HAS_TOPIC}]-(everything:${NodeTypesEnum.POST})
      WHERE everything.isPrivate = false
      MATCH (poster)-[posted:POSTED]->(everything)
      RETURN u, has_interest, type(posted) AS relationLabel, everything, poster
      ORDER BY everything.createdAt DESC
      LIMIT 125
    `;

    const [
      userContentRecords,
      userPetContentRecords,
      userFollowsContentRecords,
      petFollowsContentRecords,
      userTopicsContentRecords,
    ] = await Promise.all([
      this.neo4jService.query(userContentQuery, { userId: userId }),
      this.neo4jService.query(userPetsContentQuery, { userId: userId }),
      this.neo4jService.query(userFollowsContentQuery, { userId: userId }),
      this.neo4jService.query(petFollowsContentQuery, { userId: userId }),
      this.neo4jService.query(userTopicsContentQuery, { userId: userId }),
    ]);

    const userFeedRelations = this.parseUserContentRecords(userContentRecords, userId);
    const userPetFeedRelations = this.parseUserPetsContentRecords(userPetContentRecords, userId);
    const userFollowFeedRelations = this.parseUserFollowsContentRecords(userFollowsContentRecords, userId);
    const petFollowFeedRelations = this.parsePetFollowsContentRecords(petFollowsContentRecords, userId);
    const userTopicsFeedRelations = this.parseUserTopicsContentRecords(userTopicsContentRecords, userId);

    let finalFeed = [
      ...userFeedRelations,
      ...userFollowFeedRelations,
      ...petFollowFeedRelations,
      ...userPetFeedRelations,
      ...userTopicsFeedRelations,
    ];

    if (finalFeed?.length === 0) {
      const topReachedPostQuery = `
      MATCH (everything:${NodeTypesEnum.POST})<-[posted:${RelationTypesEnum.POSTED}]-(poster)
      WHERE (everything.isPrivate = false AND everything.hasAllowedUsers = false AND poster.isPrivate = false)
      RETURN poster, posted, type(posted) AS relationLabel, everything
      ORDER BY everything.postDegreeScore DESC
      LIMIT 75
      `;

      const userTopReachedContentRecords = await this.neo4jService.query(topReachedPostQuery);

      const userTopReachedFeedRelations = this.parseUserTopReachedContentRecords(userTopReachedContentRecords, userId);

      let finalFeed = [...userTopReachedFeedRelations];
      // Group by contentId
      // Sort by recparseUserTopReachedContentRecordsency per contentId
      finalFeed = Object.entries<GraphFeedNode[]>(
        finalFeed.reduce(function (acc, feedItem) {
          acc[feedItem.content._id] = acc[feedItem.content._id] || [];
          acc[feedItem.content._id].push(feedItem);

          return acc;
        }, Object.create({})),
      ).map(([key, value]) => {
        const sortedActions = value.sort((a, b) => {
          const aDate = new Date(a.action.data.createdAt);
          const bDate = new Date(b.action.data.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
        return sortedActions[0];
      });

      return { rawFeed: finalFeed };
    }

    // Group by contentId
    // Sort by recency per contentId
    finalFeed = Object.entries<GraphFeedNode[]>(
      finalFeed.reduce(function (acc, feedItem) {
        acc[feedItem.content._id] = acc[feedItem.content._id] || [];
        acc[feedItem.content._id].push(feedItem);

        return acc;
      }, Object.create({})),
    ).map(([key, value]) => {
      const sortedActions = value.sort((a, b) => {
        const aDate = new Date(a.action.data.createdAt);
        const bDate = new Date(b.action.data.createdAt);
        return bDate.getTime() - aDate.getTime();
      });
      return sortedActions[0];
    });

    return { rawFeed: finalFeed };
  }

  private generateUniqueFeed(finalFeed: GraphFeedNode[]): GraphFeedNode[] {
    let userGroupedFeed = Object.entries<GraphFeedNode[]>(
      finalFeed.reduce(function (acc, feedItem) {
        acc[feedItem.action.actor] = acc[feedItem.action.actor] || [];
        acc[feedItem.action.actor].push(feedItem);
        return acc;
      }, Object.create({})),
    ).map(([key, value]) => {
      // Ascending sort by createdAt because we pop from the end when we do our round robin
      value.sort((a, b) => {
        const aDate = new Date(a.action.data.createdAt);
        const bDate = new Date(b.action.data.createdAt);
        return aDate.getTime() - bDate.getTime();
      });

      return {
        user: key,
        actions: value,
        mostRecentActionDate: new Date(value[value.length - 1]?.action?.data?.createdAt),
      };
    });

    // Descending sort by most recent action date
    userGroupedFeed = userGroupedFeed.sort((a, b) => {
      return b.mostRecentActionDate.getTime() - a.mostRecentActionDate.getTime();
    });

    // Round robin the feed
    const uniqueFeed: GraphFeedNode[] = [];
    const userCount = userGroupedFeed.length;
    let i = 0;
    while (userGroupedFeed.find((feedItem) => feedItem.actions.length > 0)) {
      if (userGroupedFeed[i % userCount].actions.length) {
        uniqueFeed.push(userGroupedFeed[i % userCount].actions.pop() as GraphFeedNode);
      }

      i++;
    }

    // eslint-disable-next-line no-console
    console.log('uniqueFeed ', uniqueFeed);

    return uniqueFeed;
  }

  private parseUserContentRecords(userContentRecords: Record[], userId: string) {
    const userRelationTypes = userContentRecords.map((record) => record.get('relationLabel'));
    const userRelationData = userContentRecords.map((record) => record.get('posted'));
    const userContent = userContentRecords.map((record) => record.get('everything'));

    const userFeedRelations: GraphFeedNode[] = [];

    let i = 0;
    for (const type of userRelationTypes) {
      if (!type) continue;

      const parsedRelation = parseRelation(userRelationData[i]);
      const parsedContent = parseRawPostNode(userContent[i]);
      userFeedRelations.push({
        viewerId: userId,
        action: {
          type,
          actor: parsedRelation.properties.user,
          data: parsedRelation.properties,
        },
        content: parsedContent,
        contentId: parsedContent?._id,
      });
      i++;
    }

    return userFeedRelations;
  }

  private parseUserPetsContentRecords(userPetContentRecords: Record[], userId: string) {
    const userPets = userPetContentRecords.map((record) => record.get('pet'));
    const userPetRelationTypes = userPetContentRecords.map((record) => record.get('relationLabel'));
    const userPetRelationData = userPetContentRecords.map((record) => record.get('posted'));
    const userPetContent = userPetContentRecords.map((record) => record.get('everything'));

    const userPetFeedRelations: GraphFeedNode[] = [];

    let i = 0;
    for (const type of userPetRelationTypes) {
      if (!type) continue;

      const parsedRelation = parseRelation(userPetRelationData[i]);
      const parsedContent = parseRawPostNode(userPetContent[i]);
      userPetFeedRelations.push({
        viewerId: userId,
        action: {
          type,
          actor: userPets[i].properties.petId,
          data: parsedRelation.properties,
        },
        content: parsedContent,
        contentId: parsedContent?._id,
      });
      i++;
    }

    return userPetFeedRelations;
  }

  private parseUserFollowsContentRecords(userFollowsContentRecords: Record[], userId: string) {
    const userFollowing = userFollowsContentRecords.map((record) => record.get('following'));
    const userFollowRelationTypes = userFollowsContentRecords.map((record) => record.get('relationLabel'));
    const userFollowRelationData = userFollowsContentRecords.map((record) => record.get('relatedTo'));
    const userFollowContent = userFollowsContentRecords.map((record) => record.get('everything'));

    const userFollowFeedRelations: GraphFeedNode[] = [];

    let i = 0;
    for (const type of userFollowRelationTypes) {
      if (!type) continue;
      const parsedRelation = parseRelation(userFollowRelationData[i]);
      const parsedContent = parseRawPostNode(userFollowContent[i]);

      userFollowFeedRelations.push({
        viewerId: userId,
        action: {
          type,
          actor: userFollowing[i].properties.userId,
          data: parsedRelation.properties,
        },
        content: parsedContent,
        contentId: parsedContent?._id,
      });
      i++;
    }

    return userFollowFeedRelations;
  }

  private parsePetFollowsContentRecords(petFollowsContentRecords: Record[], userId: string) {
    const petFollowing = petFollowsContentRecords.map((record) => record.get('following'));
    const petFollowRelationTypes = petFollowsContentRecords.map((record) => record.get('relationLabel'));
    const petFollowRelationData = petFollowsContentRecords.map((record) => record.get('posted'));
    const petFollowContent = petFollowsContentRecords.map((record) => record.get('everything'));

    const petFollowFeedRelations: GraphFeedNode[] = [];

    let i = 0;
    for (const type of petFollowRelationTypes) {
      if (!type) continue;

      const parsedRelation = parseRelation(petFollowRelationData[i]);
      const parsedContent = parseRawPostNode(petFollowContent[i]);
      petFollowFeedRelations.push({
        viewerId: userId,
        action: {
          type,
          actor: petFollowing[i].properties.petId,
          data: parsedRelation.properties,
        },
        content: parsedContent,
        contentId: parsedContent?._id,
      });
      i++;
    }

    return petFollowFeedRelations;
  }

  private parseUserTopicsContentRecords(userTopicsContentRecords: Record[], userId: string) {
    const poster = userTopicsContentRecords.map((record) => record.get('poster'));
    const userTopicsRelationTypes = userTopicsContentRecords.map((record) => record.get('relationLabel'));
    const userTopicsRelationData = userTopicsContentRecords.map((record) => record.get('has_interest'));
    const userTopicsContent = userTopicsContentRecords.map((record) => record.get('everything'));

    const userTopicsFeedRelations: GraphFeedNode[] = [];

    let i = 0;
    for (const type of userTopicsRelationTypes) {
      if (!type) continue;

      const parsedRelation = parseRelation(userTopicsRelationData[i]);
      const parsedContent = parseRawPostNode(userTopicsContent[i]);
      userTopicsFeedRelations.push({
        viewerId: userId,
        action: {
          type,
          actor: poster[i].properties?.userId || poster[i].properties.petId,
          data: parsedRelation.properties,
        },
        content: parsedContent,
        contentId: parsedContent?._id,
      });
      i++;
    }

    return userTopicsFeedRelations;
  }

  private parseUserTopReachedContentRecords(topReachedPostRecords: Record[], userId: string) {
    const poster = topReachedPostRecords.map((record) => record.get('poster'));
    const userTopReachedRelationTypes = topReachedPostRecords.map((record) => record.get('relationLabel'));
    const userTopReachedRelationData = topReachedPostRecords.map((record) => record.get('posted'));
    const userTopReachedContent = topReachedPostRecords.map((record) => record.get('everything'));

    const userTopReachedFeedRelations: GraphFeedNode[] = [];

    let i = 0;
    for (const type of userTopReachedRelationTypes) {
      if (!type) continue;

      const parsedRelation = parseRelation(userTopReachedRelationData[i]);
      const parsedContent = parseRawPostNode(userTopReachedContent[i]);
      userTopReachedFeedRelations.push({
        viewerId: userId,
        action: {
          type,
          actor: poster[i].properties?.userId || poster[i].properties.petId,
          data: parsedRelation.properties,
        },
        content: parsedContent,
        contentId: parsedContent?._id,
      });
      i++;
    }

    return userTopReachedFeedRelations;
  }

  private async upsertGraphFeed(feed: GraphFeedNode[], userId: string) {
    const queryParams = {
      props: {
        feed: feed.map((feedItem, index) => {
          return {
            ...feedItem,
            content: JSON.stringify(feedItem.content),
            action: JSON.stringify(feedItem.action),
            feedId: `feed_${userId}_${index}`,
            feedOrder: index,
          };
        }),
      },
    };

    const deleteFeedQuery = `
		  MATCH (:${NodeTypesEnum.USER} {userId: $userId})-[:${RelationTypesEnum.HAS_FEED}]->(f:Feed)
		  DETACH DELETE f
		`;

    await lastValueFrom(
      from(this.neo4jService.query(deleteFeedQuery, { userId: userId })).pipe(
        retry({
          count: MAX_FEED_UPSERT_RETRIES,
          delay(error, retryCount) {
            this.logger.error(`Error deleting feed, retry: ${retryCount}`, {
              error: { message: error?.message, stack: error?.stack },
              userId,
            });

            return timer(MAX_FEED_UPSERT_RETRIES_INTERVAL);
          },
          resetOnSuccess: true,
        }),
      ),
    );

    const upsertQuery = `
      UNWIND $props.feed as feed
      MATCH (u:${NodeTypesEnum.USER} {userId: feed.viewerId})
      MERGE (f:${NodeTypesEnum.FEED} {feedId: feed.feedId})
      ON CREATE
        SET
          f.contentId = feed.contentId,
          f.viewerId = feed.viewerId,
          f.content = feed.content,
          f.action = feed.action,
          f.feedOrder = feed.feedOrder
      WITH u, f
      MERGE (u)-[:${RelationTypesEnum.HAS_FEED} {relationType: '${RelationTypesEnum.HAS_FEED}'}]->(f)
    `;

    await lastValueFrom(
      from(this.neo4jService.query(upsertQuery, queryParams)).pipe(
        retry({
          count: MAX_FEED_UPSERT_RETRIES,
          delay(error, retryCount) {
            this.logger.error(`Error upserting feed, retry: ${retryCount}`, {
              error: { message: error?.message, stack: error?.stack },
              userId,
            });

            return timer(MAX_FEED_UPSERT_RETRIES_INTERVAL);
          },
          resetOnSuccess: true,
        }),
      ),
    );
  }
}
