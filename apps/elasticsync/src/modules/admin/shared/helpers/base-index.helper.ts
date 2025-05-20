import {
  BulkRequest,
  IndicesIndexSettings,
  MappingProperty,
  MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';
import { OnModuleInit } from '@nestjs/common';
import { DOCUMENTS_COUNT_PER_SYNC_ITERATION } from '@elasticsync/shared-module/config/consts.config';
import { CustomError, CustomLoggerService, ElasticsearchService, ErrorType } from '@instapets-backend/common';
import { ChangeStreamDocument, ResumeToken } from 'mongodb';
import { Model } from 'mongoose';
import { ChangeStreamTokenUtil } from './change-stream-token.service';
import { Subject, interval, lastValueFrom, switchMap, take, tap } from 'rxjs';

export abstract class BaseIndexHelper implements OnModuleInit {
  private filterFields: string[] = [
    'type',
    'country',
    'city',
    'area',
    'breed',
    'post',
    'replyOn',
    'body',
    'createdAt',
    'date',
    'isViewable',
    'isArchived',
    'isFound',
    'totalPets',
  ];
  private readonly RETRY_DELAY = 10000;
  private readonly MAX_RETRY_WITH_TOKEN_COUNT = 3;
  private readonly MAX_RETRY_WITHOUT_TOKEN_COUNT = 3;
  private retryCount = 0;
  private isRetryingWithoutToken = false;
  private resetCountSubject = new Subject<void>();
  private model: Model<any>;
  private resumeToken: ResumeToken;
  protected logger: CustomLoggerService;
  protected elasticsearchService: ElasticsearchService;
  protected changeStreamTokenUtil: ChangeStreamTokenUtil;
  indexName: string;
  esSchema: Record<string, MappingProperty>;

  constructor(
    changeStreamTokenUtil: ChangeStreamTokenUtil,
    logger: CustomLoggerService,
    elasticsearchService: ElasticsearchService,
    model: Model<any>,
  ) {
    this.changeStreamTokenUtil = changeStreamTokenUtil;
    this.logger = logger;
    this.elasticsearchService = elasticsearchService;
    this.model = model;
    this.indexName = this.model.modelName.toLowerCase();
  }

  async onModuleInit() {
    this.initResetRetryCountSubject();
    this.resumeToken = await this.changeStreamTokenUtil.getResumeToken(this.indexName);
  }

  async listen() {
    this.model
      .watch(undefined, { fullDocument: 'updateLookup', ...(this.resumeToken && { startAfter: this.resumeToken }) })
      .on('change', async (data: ChangeStreamDocument) => {
        try {
          this.resumeToken = data._id;
          await this.changeStreamTokenUtil.setResumeToken(this.indexName, data._id);
          switch (data.operationType) {
            case 'delete':
              await this.delete(data.documentKey._id.toString());
              break;
            case 'insert':
            case 'update':
            case 'replace':
              await this.syncCollection([data.documentKey._id.toString()]);
              break;
            case 'drop':
              this.logger.log(`Change stream was dropped for ${this.indexName}`);
              break;
            case 'invalidate':
              this.logger.log(`Change stream was invalidated for ${this.indexName}`);
              this.listen();
              break;
            default:
              // console.log('operationType not supported', data.operationType);

              throw new CustomError({
                errorType: ErrorType.UNKNOWN,
                localizedMessage: {
                  en: `Operation type not supported: ${data.operationType}`,
                  ar: `نوع العملية غير مدعوم: ${data.operationType}`,
                },
                event: 'LISTEN_TO_CHANGES_FAIL',
              });
          }
        } catch (err) {
          //console.error(err);

          let exception = err;
          if (!(err instanceof CustomError)) {
            exception = new CustomError({
              errorType: ErrorType.UNKNOWN,
              localizedMessage: {
                en: `Elasticsearch failed to sync ${this.indexName}`,
                ar: `فشل Elasticsearch في مزامنة ${this.indexName}`,
              },
              event: 'LISTEN_TO_CHANGES_FAIL',
              error: err,
            });
          }

          this.logger.error(`Elasticsearch failed to sync ${this.indexName}`, {
            exception: exception,
            http: {
              status_code: exception.statusCode,
              status_category: 'error',
            },
          });
        }
      })
      .on('error', (err) => {
        const exception = new CustomError({
          errorType: ErrorType.UNKNOWN,
          localizedMessage: {
            en: `Elasticsearch failed to sync ${this.indexName}`,
            ar: `فشل Elasticsearch في مزامنة ${this.indexName}`,
          },
          event: 'LISTEN_TO_CHANGES_FAIL',
          error: err,
        });

        this.logger.error(`Change stream encountered an error, failed to sync ${this.indexName}`, {
          exception,
          http: {
            status_code: 500,
            status_category: 'error',
          },
        });
        this.logger.log(`Retrying to listen to changes for ${this.indexName}`);
        this.listen();
      })
      .on('close', async () => {
        this.logger.log(`Change stream was closed for ${this.indexName}`);

        if (this.retryCount >= this.MAX_RETRY_WITH_TOKEN_COUNT && !this.isRetryingWithoutToken) {
          this.logger.log(`Failed to listen to changes for ${this.indexName} with token, retrying without token`);

          this.resumeToken = undefined;
          this.isRetryingWithoutToken = true;
          this.retryCount = 0;

          await this.changeStreamTokenUtil.deleteResumeToken(this.indexName);
        }

        if (this.retryCount >= this.MAX_RETRY_WITHOUT_TOKEN_COUNT && this.isRetryingWithoutToken) {
          this.logger.log(`Failed to listen to changes for ${this.indexName} without token, exiting`);

          process.exit(1);
        }

        this.retryCount++;

        await lastValueFrom(
          interval(this.RETRY_DELAY).pipe(
            take(1),
            tap(async () => {
              await this.listen();
              this.resetCountSubject.next();
            }),
          ),
        );
      })
      .on('end', () => {
        this.logger.log(`Change stream was ended for ${this.indexName}`);
      });
  }

  async reCreateIndex() {
    try {
      const existed = await this.validateIndex();

      if (existed) {
        await this.elasticsearchService.client.indices.delete({ index: this.indexName });
      }
      const indexBody = this.generateESIndexPayload({
        properties: this.esSchema,
      });

      await this.elasticsearchService.client.indices.create({
        index: this.indexName,
        ...indexBody,
      });
      this.resumeToken = undefined;
      await this.changeStreamTokenUtil.setResumeToken(this.indexName, undefined);
    } catch (err) {
      // console.error(err);

      const exception = new CustomError({
        localizedMessage: {
          en: `Elasticsearch failed to re-create ${this.indexName}`,
          ar: `فشل Elasticsearch في إعادة إنشاء ${this.indexName}`,
        },
        event: 'RECREATE_INDEX_FAIL',
        error: err,
      });

      this.logger.error(`Elasticsearch failed to re-create ${this.indexName}`, {
        exception: exception,
        http: {
          status_category: 'error',
        },
      });
    }
  }

  async synchronizeDocument(documents: any[]) {
    while (documents.length) {
      const bulkRequest: BulkRequest = { refresh: true, operations: [] };
      //const operations: any[] = [];
      documents.splice(0, DOCUMENTS_COUNT_PER_SYNC_ITERATION).map((doc) => {
        const { _id, deletedAt, ...rest } = doc;
        if (!deletedAt) {
          bulkRequest.operations.push({ update: { _index: this.indexName, _id } }, { doc: rest, doc_as_upsert: true });
        } else {
          bulkRequest.operations.push({ delete: { _index: this.indexName, _id } });
        }
      });
      const result = await this.elasticsearchService.client.bulk(bulkRequest);
      if (result.errors) {
        let errorMsg: string = '';
        errorMsg = `${this.indexName} errors start ------------------------------------`;
        result.items.forEach((item) => {
          if (item.update?.error) {
            errorMsg += `\n${JSON.stringify(item.update.error, null, 2)}`;
          }
        });
        errorMsg += `\n${this.indexName} errors end ------------------------------------`;
        this.logger.error(errorMsg);
      } else if (!documents.length) {
        //  console.log(`${this.indexName} has been created successfully`);
      }
    }
  }

  async delete(_id: string) {
    if (_id) {
      try {
        await this.elasticsearchService.client.delete({
          id: _id,
          index: this.indexName,
        });
      } catch (err) {
        //  console.error(err);

        let exception = err;
        if (!(err instanceof CustomError)) {
          exception = new CustomError({
            errorType: ErrorType.UNKNOWN,
            localizedMessage: {
              en: `Elasticsearch failed to delete from ${this.indexName} with _id: ${_id}`,
              ar: `فشل Elasticsearch في الحذف من ${this.indexName} مع _id: ${_id}`,
            },
            event: 'LISTEN_TO_DELETE_FAIL',
            error: err,
          });
        }

        this.logger.error(`Elasticsearch failed to delete from ${this.indexName} with _id: ${_id}`, {
          exception: exception,
          http: {
            status_code: exception.statusCode,
            status_category: 'error',
          },
        });
      }
    }
  }

  async validateIndex() {
    return this.elasticsearchService.client.indices.exists({ index: this.indexName });
  }

  private addAnalyzer(obj: any) {
    Object.keys(obj).forEach((key) => {
      if (obj[key].properties) {
        return this.addAnalyzer(obj[key].properties);
      }
      if (key === 'mobile') {
        obj[key].analyzer = 'ngram_token_analyzer_max_12';
        obj[key].search_analyzer = 'search_term_analyzer';
      } else if (key === 'indexedId') {
        obj[key].analyzer = 'ngram_token_analyzer_max_24';
        obj[key].search_analyzer = 'search_term_analyzer';
      } else if (
        ![
          //TODO: maybe change the logic so we dont need to do this for everyfield
          '_id',
          ...this.filterFields,
        ].includes(key) &&
        obj[key].type !== 'search_as_you_type'
      ) {
        obj[key].analyzer = 'ngram_token_analyzer_max_9';
        obj[key].search_analyzer = 'search_term_analyzer';
      }
    });
  }

  private prepareMappings(mappings: Record<string, MappingProperty>) {
    this.addAnalyzer(mappings.properties);
    return mappings;
  }

  private generateESIndexPayload(mappings: Record<string, MappingProperty>): {
    settings: IndicesIndexSettings;
    mappings: MappingTypeMapping;
  } {
    return {
      settings: {
        index: {
          max_ngram_diff: 12,
          analysis: {
            analyzer: {
              search_term_analyzer: {
                type: 'custom',
                filter: ['lowercase', 'asciifolding', 'no_stop'],
                tokenizer: 'whitespace',
              },
              ngram_token_analyzer_max_9: {
                type: 'custom',
                filter: ['lowercase', 'asciifolding', 'no_stop', 'ngram_filter_max_9'],
                tokenizer: 'whitespace',
              },
              ngram_token_analyzer_max_12: {
                type: 'custom',
                filter: ['lowercase', 'asciifolding', 'no_stop', 'ngram_filter_max_12'],
                tokenizer: 'whitespace',
              },
              ngram_token_analyzer_max_24: {
                type: 'custom',
                filter: ['lowercase', 'asciifolding', 'no_stop', 'ngram_filter_max_24'],
                tokenizer: 'whitespace',
              },
              search_as_you_type_filter_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'search_as_you_type_filter'],
              },
              start_with_analyzer: {
                type: 'custom',
                tokenizer: 'keyword',
                filter: ['lowercase'],
              },
            },
            filter: {
              no_stop: {
                type: 'stop',
                stopwords: 'none',
              },
              ngram_filter_max_9: {
                type: 'ngram',
                min_gram: 2,
                max_gram: 9,
              },
              ngram_filter_max_12: {
                type: 'ngram',
                min_gram: 11,
                max_gram: 12,
              },
              ngram_filter_max_24: {
                type: 'ngram',
                min_gram: 12,
                max_gram: 24,
              },
              search_as_you_type_filter: {
                type: 'edge_ngram',
                min_gram: 1,
                max_gram: 20,
              },
            },
          },
        },
      },
      mappings: {
        dynamic: 'strict',
        ...this.prepareMappings(mappings),
      },
    };
  }

  private initResetRetryCountSubject() {
    this.resetCountSubject.pipe(switchMap(() => interval(this.RETRY_DELAY * 10).pipe(take(1)))).subscribe(() => {
      // console.log('resetting retry count');
      this.retryCount = 0;
      this.isRetryingWithoutToken = false;
    });
  }

  abstract migrate(string): Promise<void>;
  abstract syncCollection(string): Promise<void>;
}
