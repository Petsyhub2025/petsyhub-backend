import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphCommentReplyRelation,
  ICommentReplyModel,
  ModelNames,
  Neo4jService,
  CommentReply,
  RelationTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class CommentReplySynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.COMMENT_REPLY) private commentReplyModel: ICommentReplyModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<CommentReply>) {
    const commentReply = await this.commentReplyModel.findById(doc._id).populate([
      {
        path: 'replyOn',
      },
    ]);

    if (!commentReply.isViewable) {
      await this.deleteFromNeo4j(commentReply._id.toString());

      return;
    }

    const migrationProps = {
      props: {
        commentReplies: [GraphCommentReplyRelation.from(commentReply)],
      },
    };

    await this.neo4jService.query(GraphCommentReplyRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.REPLIED_TO_COMMENT_ON} {commentReplyId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(CommentReplySynchronizerService.name, docId, deleteQuery);
  }
}
