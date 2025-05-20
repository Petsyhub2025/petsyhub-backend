import { QueryDslQueryContainer, SortCombinations } from '@elastic/elasticsearch/lib/api/types';

export interface MatchQueryParams {
  index: string;
  query: string;
  searchableFields: string[];
  saytFields?: string[];
  must?: QueryDslQueryContainer[];
  mustNot?: QueryDslQueryContainer[];
  filters?: QueryDslQueryContainer[];
  project?: string[];
  limit?: number;
  page?: number;
  minScore?: number;
  sort?: SortCombinations[];
  accurateCount?: boolean;
}

export interface AutoCompleteParams {
  index: string;
  query: string;
  searchableFields: string[];
  contexts?: any[];
  limit?: number;
  project?: string[];
}
