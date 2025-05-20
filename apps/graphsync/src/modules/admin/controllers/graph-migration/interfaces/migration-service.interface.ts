import { PaginationService } from '@graphsync/shared-module/utils/pagination.service';
import { Neo4jService, CustomLoggerService } from '@instapets-backend/common';
import { FilterQuery, PipelineStage } from 'mongoose';

export type MatchStage<T> = PipelineStage.Match & { $match: FilterQuery<T> };
export interface IMigrationService {
  migrate<T = any>(query?: FilterQuery<T> | MatchStage<T>): Promise<void>;
  syncToNeo4j(docs: Hydrate<any>[]): Promise<void>;

  readonly neo4jService: Neo4jService;
  readonly logger: CustomLoggerService;
  readonly paginationService: PaginationService;
}
