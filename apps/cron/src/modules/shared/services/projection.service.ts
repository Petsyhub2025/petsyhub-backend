import { Injectable } from '@nestjs/common';
import { CustomLoggerService, Neo4jService } from '@instapets-backend/common';

@Injectable()
export class ProjectionService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly logger: CustomLoggerService,
  ) {}

  async dropProjection(graphName: string) {
    await this.neo4jService.query(`CALL gds.graph.drop('${graphName}')`);
  }

  async projectGraph(graphName: string, graphQuery: string) {
    try {
      await this.neo4jService.query(graphQuery);
    } catch (e) {
      this.logger.error('Graph Projection Error, Dropping & Retrying...', { error: e });
      await this.neo4jService.query(`CALL gds.graph.drop('${graphName}')`);
      await this.neo4jService.query(graphQuery);
    }
  }
}
