import { IMigrationService, MatchStage } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  CustomLoggerService,
  GraphCommentReplyLikeRelation,
  ICommentReplyLikeModel,
  ModelNames,
  Neo4jService,
  CommentReplyLike,
} from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

@Injectable()
export class CommentReplyLikeMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.COMMENT_REPLY_LIKE) private commentReplyLikeModel: ICommentReplyLikeModel,
  ) {}

  async migrate<T = any>(query?: MatchStage<T>) {
    this.logger.log('Starting CommentReply Like Model migration to Neo4j');

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'commentreplies',
          let: {
            commentReplyId: '$commentReply',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$commentReplyId', null] }],
                },
              },
            },
          ],
          as: 'commentReply',
        },
      },
      {
        $unwind: {
          path: '$commentReply',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'comments',
          let: {
            commentId: '$commentReply.replyOn',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$commentId', null] }],
                },
              },
            },
          ],
          as: 'commentReply.replyOn',
        },
      },
      {
        $unwind: {
          path: '$commentReply.replyOn',
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.commentReplyLikeModel, query, pipeline, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<CommentReplyLike>[]) {
    try {
      const migrationProps = {
        props: {
          likes: GraphCommentReplyLikeRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphCommentReplyLikeRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.likes.length} CommentReply Like Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate CommentReply Like Model to Neo4j`, { error: e });
    }
  }
}
