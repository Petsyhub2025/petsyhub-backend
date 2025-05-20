import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { CustomLoggerService, IUserTopicModel, ModelNames, UserTopic } from '@instapets-backend/common';
import { UserHasInterestSynchronizerService } from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';

@Injectable()
export class UserTopicListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly userHasInterestSynchronizerService: UserHasInterestSynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.USER_TOPIC) private userTopicModel: IUserTopicModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(UserTopicListenerService.name);

    const changeStream = this.userTopicModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(UserTopicListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.userHasInterestSynchronizerService.syncToNeo4j(change.fullDocument as Hydrate<UserTopic>);
              break;
            case 'delete':
              await this.userHasInterestSynchronizerService.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync userFollow to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${UserTopicListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${UserTopicListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${UserTopicListenerService.name}`);

        await this.handleStreamClosing(UserTopicListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${UserTopicListenerService.name}`);
      });
  }
}
