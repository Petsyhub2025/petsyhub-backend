import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { PetFollow, CustomLoggerService, IPetFollowModel, ModelNames } from '@instapets-backend/common';
import { PetFollowSynchronizerService } from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';

@Injectable()
export class PetFollowListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly petFollowSynchronizer: PetFollowSynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.PET_FOLLOW) private petFollowModel: IPetFollowModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(PetFollowListenerService.name);

    const changeStream = this.petFollowModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(PetFollowListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.petFollowSynchronizer.syncToNeo4j(change.fullDocument as Hydrate<PetFollow>);
              break;
            case 'delete':
              await this.petFollowSynchronizer.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync petFollow to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${PetFollowListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${PetFollowListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${PetFollowListenerService.name}`);

        await this.handleStreamClosing(PetFollowListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${PetFollowListenerService.name}`);
      });
  }
}
