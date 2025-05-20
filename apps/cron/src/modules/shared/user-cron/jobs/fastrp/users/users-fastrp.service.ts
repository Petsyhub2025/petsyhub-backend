import { Injectable } from '@nestjs/common';
import { Neo4jService, CustomLoggerService, RelationTypesEnum, NodeTypesEnum } from '@instapets-backend/common';
import { ProjectionService } from '@cron/shared-module/services/projection.service';
import { USER_TO_USER_SIMILARITY_GRAPH } from '@cron/shared-module/user-cron/constants';

@Injectable()
export class UsersFastRPService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private logger: CustomLoggerService,
    private readonly projectionService: ProjectionService,
  ) {}

  async runUsersFastRP() {
    const graphProjectionQuery = `
      CALL gds.graph.project.cypher(
        '${USER_TO_USER_SIMILARITY_GRAPH}',
        'MATCH(n) WHERE (n:User AND (n)-[:${RelationTypesEnum.INTERACTED_WITH}|${RelationTypesEnum.LIKED}|${RelationTypesEnum.COMMENTED_ON}|${RelationTypesEnum.LIVES_IN_COUNTRY}]->()) OR n:${NodeTypesEnum.COUNTRY} OR n:${NodeTypesEnum.POST} OR n:${NodeTypesEnum.PET_TYPE} RETURN id(n) AS id',
        "MATCH (u:User)-[r:${RelationTypesEnum.INTERACTED_WITH}|${RelationTypesEnum.LIKED}|${RelationTypesEnum.COMMENTED_ON}|${RelationTypesEnum.LIVES_IN_COUNTRY}]->(n) WHERE n:${NodeTypesEnum.COUNTRY} OR n:${NodeTypesEnum.POST} OR n:${NodeTypesEnum.PET_TYPE} RETURN id(u) as source, id(n) as target"
      )
    `;

    const fastRPQuery = `
      CALL gds.fastRP.mutate(
        '${USER_TO_USER_SIMILARITY_GRAPH}',
        {
          embeddingDimension: 256,
          mutateProperty: 'userFastRPMutateEmbeddings',
          iterationWeights: [1, 0.8],
          normalizationStrength: -0.5,
          randomSeed: 1337,
          concurrency: 1
        }
      )
      YIELD nodePropertiesWritten
      RETURN nodePropertiesWritten
    `;

    await this.projectionService.projectGraph(USER_TO_USER_SIMILARITY_GRAPH, graphProjectionQuery);
    const result = await this.neo4jService.query(fastRPQuery);

    this.logger.log('Users FastRP Result, Node Properties Mutated', {
      nodePropertiesWritten: result[0]?.get('nodePropertiesWritten'),
    });
  }
}
