import { Injectable } from '@nestjs/common';
import { Neo4jService } from '@common/modules/neo4j/services/neo4j.service';
import { CustomLoggerService } from '@common/modules/common/services/logger/custom-logger.service';
import { ProjectionService } from '@cron/shared-module/services/projection.service';
import { POSTS_DEGREE_GRAPH } from '@cron/shared-module/user-cron/constants';
import { RelationTypesEnum } from '@instapets-backend/common';

@Injectable()
export class PostsDegreeService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private logger: CustomLoggerService,
    private readonly projectionService: ProjectionService,
  ) {}

  async runPostsDegree() {
    const graphProjectionQuery = `
      MATCH (u:User)-[r:${RelationTypesEnum.POSTED}|${RelationTypesEnum.COMMENTED_ON}|${RelationTypesEnum.REPLIED_TO_COMMENT_ON}|${RelationTypesEnum.LIKED}|${RelationTypesEnum.LIKED_A_COMMENT_ON}|${RelationTypesEnum.LIKED_A_COMMENT_REPLY_ON}]->(p:Post)
      WITH gds.graph.project('${POSTS_DEGREE_GRAPH}', u, p) AS g
      RETURN g.graphName AS graph, g.nodeCount AS nodes, g.relationshipCount AS rels
    `;

    const degreeCentralityQuery = `
      CALL gds.degree.stream('${POSTS_DEGREE_GRAPH}', {
        orientation: 'REVERSE',
        concurrency: 1
      })
      YIELD nodeId, score
      WITH gds.util.asNode(nodeId) AS post, score AS engagement
      WHERE post:Post
      SET post.postDegreeScore = engagement
      RETURN count(*) AS nodePropertiesWritten
    `;

    await this.projectionService.projectGraph(POSTS_DEGREE_GRAPH, graphProjectionQuery);
    const result = await this.neo4jService.query(degreeCentralityQuery);

    await this.projectionService.dropProjection(POSTS_DEGREE_GRAPH);

    this.logger.log('Posts Degree Centrality Result, Node Properties Written', {
      nodePropertiesWritten: result[0]?.get('nodePropertiesWritten'),
    });
  }
}
