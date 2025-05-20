import { Inject, Injectable } from '@nestjs/common';
import {
  GraphAction,
  GraphActionDto,
  GraphContentDto,
  GraphFeedNode,
  GraphFeedResponseDto,
  IPetModel,
  IUserModel,
  ModelNames,
  NodeTypesEnum,
  Pet,
  Post,
  User,
} from '@instapets-backend/common';
import { HydratedDocument, Types } from 'mongoose';
import { EnrichPostsService } from './enrich-posts.service';

@Injectable()
export class EnrichFeedService {
  constructor(
    @Inject(ModelNames.PET) private petModel: IPetModel,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    private readonly enrichPostsService: EnrichPostsService,
  ) {}

  async enrichFeed(
    feed: GraphFeedNode[],
    userId: string,
    likedByFollowing: {
      [key: string]: string;
    },
  ) {
    const enrichedFeed = await Promise.all(
      feed.map(async (feedItem) => {
        const enrichedData: {
          content: GraphContentDto;
          action?: GraphActionDto;
        } = null as any;

        const { content, action } = await this.enrichPostContent(
          feedItem.content as GraphContentDto,
          feedItem.action,
          userId,
        );

        const likedByFollowingUser = likedByFollowing[content.post?._id?.toString()];
        type PostWithLikedByFollowing = HydratedDocument<Post> & { likedByFollowing: User & { _id: Types.ObjectId } };

        if (content?.type === NodeTypesEnum.POST && likedByFollowingUser) {
          const user = await this.userModel.findById(likedByFollowingUser, { firstName: 1, lastName: 1 }).lean();
          (<PostWithLikedByFollowing>content.post).likedByFollowing = user;
        }

        return {
          id: feedItem.feedOrder,
          contentType: action?.type || content?.type,
          content: { ...content },
          ...(action && { action: action }),
        };
      }),
    );

    return enrichedFeed;
  }

  private async enrichPostContent(content: GraphContentDto, action: GraphAction, viewerId: string) {
    const finalContent = content;

    if (action.type !== 'POSTED') {
      const graphActionDto: GraphActionDto = new GraphActionDto();
      graphActionDto.actor = await this.getActionActor(action);

      let enrichedActionData: any;
      switch (action?.data?.type) {
        case 'PostLike':
          enrichedActionData = {
            post: finalContent.post,
          };
          break;
        case 'PostComment':
          enrichedActionData = {
            comment: await this.enrichPostsService.getEnrichedPostCommentContent(action, viewerId),
          };
          break;
        case 'PostCommentLike':
          enrichedActionData = {
            comment: await this.enrichPostsService.getEnrichedPostCommentLikeContent(action, viewerId),
          };
          break;
        case 'PostCommentReply':
          enrichedActionData = {
            commentReply: await this.enrichPostsService.getEnrichedPostCommentReplyContent(action, viewerId),
          };
          break;
        case 'PostCommentReplyLike':
          enrichedActionData = {
            commentReply: await this.enrichPostsService.getEnrichedPostCommentReplyLikeContent(action, viewerId),
          };
          break;
        default:
          break;
      }

      graphActionDto.actionCreationDate = action.data.createdAt;
      graphActionDto.type = action.data.type;
      graphActionDto.data = enrichedActionData;

      return { content: finalContent, action: graphActionDto };
    }

    return { content: finalContent };
  }

  private async getActionActor(action: GraphAction): Promise<HydratedDocument<Pet> | HydratedDocument<User>> {
    let actorModel = action.data?.userType === 'user' ? 'userModel' : 'petModel';

    if (!action.data?.userType) {
      actorModel = 'userModel';
    }

    return await this?.[actorModel]
      .findById(action.actor)
      .populate([
        ...(actorModel === 'petModel'
          ? [
              {
                path: 'user',
                select: 'firstName lastName username profilePictureMedia',
              },
            ]
          : []),
      ])
      .select(
        actorModel === 'userModel' ? 'firstName lastName username profilePictureMedia' : 'name profilePictureMedia',
      )
      .lean();
  }
}
