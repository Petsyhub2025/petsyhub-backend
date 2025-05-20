import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphCommentReplyLikeRelation,
  ICommentReplyLikeModel,
  ModelNames,
  Neo4jService,
  CommentReplyLike,
  RelationTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class CommentReplyLikeSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.COMMENT_REPLY_LIKE) private commentReplyLikeModel: ICommentReplyLikeModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<CommentReplyLike>) {
    const commentReplyLike = await this.commentReplyLikeModel.findById(doc._id).populate([
      {
        path: 'commentReply',
        populate: {
          path: 'replyOn',
        },
      },
    ]);

    const migrationProps = {
      props: {
        likes: [GraphCommentReplyLikeRelation.from(commentReplyLike)],
      },
    };

    await this.neo4jService.query(GraphCommentReplyLikeRelation.syncQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.LIKED_A_COMMENT_REPLY_ON} {likeId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(CommentReplyLikeSynchronizerService.name, docId, deleteQuery);
  }
}
