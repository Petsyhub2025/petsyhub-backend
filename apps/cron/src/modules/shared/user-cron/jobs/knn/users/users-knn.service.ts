import { Injectable } from '@nestjs/common';
import { Neo4jService, CustomLoggerService, RelationTypesEnum } from '@instapets-backend/common';
import { ProjectionService } from '@cron/shared-module/services/projection.service';
import { USER_TO_USER_SIMILARITY_GRAPH } from '@cron/shared-module/user-cron/constants';

@Injectable()
export class UsersKNNService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private logger: CustomLoggerService,
    private readonly projectionService: ProjectionService,
  ) {}

  async runUsersKNN() {
    const kNNQuery = `
      CALL gds.knn.stream('${USER_TO_USER_SIMILARITY_GRAPH}', {
        topK: 10,
        nodeProperties: ['userFastRPMutateEmbeddings'],
        randomSeed: 1337,
        concurrency: 1,
        sampleRate: 0.8,
        deltaThreshold: 0.001
      })
      YIELD node1, node2, similarity
      WITH gds.util.asNode(node1) as A, gds.util.asNode(node2) as B, similarity
      WHERE similarity > 0.70 AND A.userId IS NOT NULL AND B.userId IS NOT NULL
      MERGE (A)-[similar:${RelationTypesEnum.USER_SIMILAR} {relationType: '${RelationTypesEnum.USER_SIMILAR}'}]->(B)
      ON CREATE
        SET similar.similarity = similarity
      ON MATCH
        SET similar.similarity = similarity
    `;

    await this.neo4jService.query(kNNQuery);
    await this.projectionService.dropProjection(USER_TO_USER_SIMILARITY_GRAPH);

    this.logger.log('Users KNN Done.');
  }
}
