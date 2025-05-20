import {
  Fuzziness,
  QueryDslQueryContainer,
  QueryDslSpanQuery,
  SearchHitsMetadata,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@instapets-backend/common';
import { AutoCompleteParams, MatchQueryParams } from './elastic-search-helper.type';

@Injectable()
export class ElasticSearchHelperService {
  constructor(private elasticSearchService: ElasticsearchService) {}

  private getFieldBoost(field: string): number {
    return field.split('^')[1] ? Number(field.split('^')[1]) : 1;
  }

  private getFieldWithoutBoost(field: string): string {
    return field.split('^')[0];
  }

  private splitQuery(query: string): string[] {
    return query.split(' ');
  }

  private fuzzySpanNearQuery(
    searchableField: string,
    query: string,
    boostMultiplier = 1,
    slop = 1,
    fuzziness?: Fuzziness,
  ): QueryDslQueryContainer {
    const fieldWithoutBoost = this.getFieldWithoutBoost(searchableField);
    return {
      span_near: {
        clauses: this.splitQuery(query).map((q): QueryDslSpanQuery => {
          return {
            span_multi: {
              match: {
                fuzzy: {
                  [fieldWithoutBoost]: {
                    fuzziness: fuzziness,
                    value: q,
                  },
                },
              },
            },
          };
        }),
        boost: this.getFieldBoost(searchableField) * boostMultiplier,
        slop: slop,
        in_order: true,
      },
    };
  }

  private phraseQueryWithSpanNear(
    searchableFields: string[],
    query: string,
    boostMultiplier = 1,
    slop = 1,
    fuzziness?: Fuzziness,
  ): QueryDslQueryContainer[] {
    return searchableFields.map((searchableField) => {
      return this.fuzzySpanNearQuery(searchableField, query, boostMultiplier, slop, fuzziness);
    });
  }

  private boolPrefixFields(searchableFields: string[]): string[] {
    //const fields = searchableFields.map((f) => this.getFieldWithoutBoost(f));
    return searchableFields.flatMap((searchableField) => {
      const fieldWithoutBoost = this.getFieldWithoutBoost(searchableField);
      const fieldBoost = this.getFieldBoost(searchableField);
      const addedFields = [];
      addedFields.push(searchableField);
      addedFields.push(fieldWithoutBoost + '._2gram' + `^${fieldBoost}`);
      addedFields.push(fieldWithoutBoost + '._3gram' + `^${fieldBoost}`);
      //addedFields.push(fieldWithoutBoost + '._index_prefix' + `^${fieldBoost}`);
      return addedFields;
    });
  }

  async matchQuery({
    index,
    query,
    searchableFields = [],
    saytFields = [],
    must,
    mustNot,
    filters,
    project,
    limit = 10,
    page = 1,
    minScore = 10,
    sort,
    accurateCount = false,
  }: MatchQueryParams): Promise<SearchHitsMetadata<unknown>> {
    //analyze fields from es analyze api
    const [
      queryFuzzyTokens,
      //  , queryPrefixTokens
    ] = await Promise.all([
      this.elasticSearchService.client.indices.analyze({
        index: index,
        body: {
          text: query || '',
          analyzer: 'search_term_analyzer',
          // analyzer: 'ngram_token_analyzer_max_9',
        },
      }),
    ]);
    const boolPrefixFields = this.boolPrefixFields(saytFields);

    const fuzzySpanQuery = queryFuzzyTokens?.tokens?.map((t) => t.token).join(' ') || '';
    const searched = await this.elasticSearchService.client.search({
      index: index,
      body: {
        size: limit,
        from: (page - 1) * limit,
        ...(minScore && query && { min_score: minScore }),
        query: {
          bool: {
            ...(must && must.length > 0
              ? {
                  must: [...must],
                }
              : {}),
            ...(mustNot && mustNot.length > 0
              ? {
                  must_not: [...mustNot],
                }
              : {}),
            should: query
              ? [
                  //old
                  // {
                  //   multi_match: {
                  //     query,
                  //     fields: searchableFields,
                  //     boost: 10,
                  //   },
                  // },
                  // {
                  //   multi_match: {
                  //     query,
                  //     fields: searchableFields,
                  //     fuzziness: 'auto',
                  //   },
                  // },
                  //new
                  ...this.phraseQueryWithSpanNear(searchableFields, fuzzySpanQuery, 1, 0, 0),
                  ...(boolPrefixFields && boolPrefixFields.length > 0
                    ? ([
                        {
                          multi_match: {
                            query: query,
                            type: 'bool_prefix',
                            fields: boolPrefixFields,
                            fuzziness: 0,
                            boost: 100,
                          },
                        },
                      ] as QueryDslQueryContainer[])
                    : []),
                ]
              : [],
            ...(filters && filters.length > 0
              ? {
                  filter: [...filters],
                }
              : {}),
          },
        },
        ...(sort && sort.length > 0 && !query ? { sort: [...sort] } : {}),
        //USE THIS IF U WANT ACCURATE COUNT BEYOND 10K LIMIT (SLOW)
        ...(accurateCount && { track_total_hits: accurateCount }),
        ...(project && project.length > 0
          ? {
              _source: [...project],
            }
          : { _source: false }),
      },
    });
    return searched.hits;
  }

  async autoCompleteQuery({ index, query, searchableFields, contexts, limit = 5, project }: AutoCompleteParams) {
    return (
      await Promise.all(
        searchableFields.map(async (field) => {
          const result: any = await this.elasticSearchService.client.search({
            index: index,
            body: {
              // _source: ['_id', 'name'],
              suggest: {
                suggestion: {
                  prefix: query,
                  completion: {
                    size: limit,
                    field: field,
                    skip_duplicates: true,
                    fuzzy: {
                      fuzziness: 'AUTO',
                      min_length: 3,
                      prefix_length: 1,
                      transpositions: true,
                      unicode_aware: false,
                    },

                    ...(contexts && {
                      contexts: Object.assign({}, ...contexts),
                    }),
                    // contexts: { category : "userId" },
                  },
                },
              },
              ...(project
                ? {
                    _source: [...project],
                  }
                : { _source: false }),
            },
          });
          const options = result?.suggest?.suggestion[0]?.options || [];
          return options.length ? options : null;
        }),
      )
    )
      .filter((options) => options)
      .reduce((acc, options) => acc.concat(options), [])
      .sort((a: any, b: any) => b._score - a._score);
  }
}
