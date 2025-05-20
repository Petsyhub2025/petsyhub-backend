import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { CustomLoggerService, ITopicModel, ModelNames, Topic } from '@instapets-backend/common';
import {} from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';
import { TopicSynchronizerService } from '@graphsync/user/sync/synchronizers/topics';

@Injectable()
export class TopicListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly topicSynchronizerService: TopicSynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.TOPIC) private topicModel: ITopicModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(TopicListenerService.name);

    const changeStream = this.topicModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(TopicListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.topicSynchronizerService.syncToNeo4j(change.fullDocument as Hydrate<Topic>);
              break;
            case 'delete':
              await this.topicSynchronizerService.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync topic to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${TopicListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${TopicListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${TopicListenerService.name}`);

        await this.handleStreamClosing(TopicListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${TopicListenerService.name}`);
      });
  }
}
