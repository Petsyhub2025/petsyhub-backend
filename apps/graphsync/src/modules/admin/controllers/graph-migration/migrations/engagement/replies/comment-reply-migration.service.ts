import { IMigrationService, MatchStage } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  CommentReply,
  CustomLoggerService,
  GraphCommentReplyRelation,
  ICommentReplyModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

@Injectable()
export class CommentReplyMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
  ) {}

  async migrate<T = any>(query?: MatchStage<T>) {
    this.logger.log('Starting CommentReply Model migration to Neo4j');

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'comments',
          let: {
            commentId: '$replyOn',
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
          as: 'replyOn',
        },
      },
      {
        $unwind: {
          path: '$replyOn',
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.commentReplyModel, query, pipeline, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<CommentReply>[]) {
    try {
      const migrationProps = {
        props: {
          commentReplies: GraphCommentReplyRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphCommentReplyRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.commentReplies.length} CommentReply Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate CommentReply Model to Neo4j`, { error: e });
    }
  }
}
