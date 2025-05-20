import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphCommentRelation,
  ICommentModel,
  ModelNames,
  Neo4jService,
  Comment,
  RelationTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class CommentSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.COMMENT) private commentModel: ICommentModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<Comment>) {
    const comment = await this.commentModel.findById(doc._id);

    if (!comment.isViewable) {
      await this.deleteFromNeo4j(comment._id.toString());

      return;
    }

    const migrationProps = {
      props: {
        comments: [GraphCommentRelation.from(comment)],
      },
    };

    await this.neo4jService.query(GraphCommentRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.COMMENTED_ON} {commentId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(CommentSynchronizerService.name, docId, deleteQuery);
  }
}
