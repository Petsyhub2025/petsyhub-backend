import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  GraphLikeRelation,
  IPostLikeModel,
  ModelNames,
  Neo4jService,
  PostLike,
  RelationTypesEnum,
} from '@instapets-backend/common';
import { MaintainUserInteractionsService } from '@graphsync/user/shared';

@Injectable()
export class PostLikeSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    private readonly maintainUserInteractionsService: MaintainUserInteractionsService,
    @Inject(ModelNames.POST_LIKE) private postLikeModel: IPostLikeModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<PostLike>) {
    const postLike = await this.postLikeModel.findById(doc._id);

    const migrationProps = {
      props: {
        likes: [GraphLikeRelation.from(postLike)],
      },
    };

    await this.neo4jService.query(GraphLikeRelation.syncQuery, migrationProps);
    await this.maintainUserInteractionsService.maintainUserInteractions(postLike.authorUser.toString());
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH ()-[r:${RelationTypesEnum.LIKED} {likeId: $id}]->()
      DELETE r
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(PostLikeSynchronizerService.name, docId, deleteQuery);
  }
}
