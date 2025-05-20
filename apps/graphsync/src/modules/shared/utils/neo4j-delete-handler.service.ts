import { Injectable } from '@nestjs/common';
import { MAX_RETRIES } from '@graphsync/shared/constants';
import { CustomLoggerService, Neo4jService } from '@instapets-backend/common';

@Injectable()
export class Neo4jDeleteHandler {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly logger: CustomLoggerService,
  ) {}

  async neo4jDeleteHandler(context: string, id: string, deleteQuery: string | string[]) {
    let retries = 0;
    let error: any;
    while (retries < MAX_RETRIES) {
      try {
        if (Array.isArray(deleteQuery) && deleteQuery.length > 0) {
          await Promise.all(deleteQuery.map((query) => this.neo4jService.query(query, { id })));
        }

        if (typeof deleteQuery === 'string') {
          await this.neo4jService.query(deleteQuery, { id });
        }
        break;
      } catch (e) {
        retries++;
        error = e;
      }
    }

    if (!retries) {
      return;
    }

    this.logger.error(`[${context}]: Failed to delete with id ${id} after ${MAX_RETRIES} retries`, { error });
  }
}
