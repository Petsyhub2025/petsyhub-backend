import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphCommentLikeRelation,
  ICommentLikeModel,
  ModelNames,
  Neo4jService,
  CommentLike,
  RelationTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class CommentLikeSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.COMMENT_LIKE) private commentLikeModel: ICommentLikeModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<CommentLike>) {
    const commentLike = await this.commentLikeModel.findById(doc._id).populate([
      {
        path: 'comment',
      },
    ]);

    const migrationProps = {
      props: {
        likes: [GraphCommentLikeRelation.from(commentLike)],
      },
    };

    await this.neo4jService.query(GraphCommentLikeRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.LIKED_A_COMMENT_ON} {likeId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(CommentLikeSynchronizerService.name, docId, deleteQuery);
  }
}
