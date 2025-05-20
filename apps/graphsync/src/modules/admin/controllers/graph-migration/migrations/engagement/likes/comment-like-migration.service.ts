import { IMigrationService, MatchStage } from '@graphsync/graph-migration/interfaces/migration-service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import {
  CommentLike,
  CustomLoggerService,
  GraphCommentLikeRelation,
  ICommentLikeModel,
  ModelNames,
  Neo4jService,
} from '@instapets-backend/common';
import { PipelineStage } from 'mongoose';

@Injectable()
export class CommentLikeMigrationService implements IMigrationService {
  constructor(
    readonly neo4jService: Neo4jService,
    readonly logger: CustomLoggerService,
    readonly paginationService: PaginationService,
    @Inject(ModelNames.COMMENT_LIKE) private commentLikeModel: ICommentLikeModel,
  ) {}

  async migrate<T = any>(query?: MatchStage<T>) {
    this.logger.log('Starting Comment Like Model migration to Neo4j');

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'comments',
          let: {
            commentId: '$comment',
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
          as: 'comment',
        },
      },
      {
        $unwind: {
          path: '$comment',
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    await this.paginationService.paginateAggregate(this.commentLikeModel, query, pipeline, async (docs) => {
      await this.syncToNeo4j(docs);
    });
  }

  async syncToNeo4j(docs: Hydrate<CommentLike>[]) {
    try {
      const migrationProps = {
        props: {
          likes: GraphCommentLikeRelation.fromArray(docs),
        },
      };

      await this.neo4jService.query(GraphCommentLikeRelation.syncQuery, migrationProps);
      this.logger.log(
        `Successfully migrated ${migrationProps.props.likes.length} Comment Like Model documents to Neo4j`,
      );
    } catch (e: unknown) {
      this.logger.error(`Failed to migrate Comment Like Model to Neo4j`, { error: e });
    }
  }
}
