import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { PetType, CustomLoggerService, IPetTypeModel, ModelNames } from '@instapets-backend/common';
import { PetTypeSynchronizerService } from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';

@Injectable()
export class PetTypeListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly petTypeSynchronizer: PetTypeSynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.PET_TYPE) private petTypeModel: IPetTypeModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(PetTypeListenerService.name);

    const changeStream = this.petTypeModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(PetTypeListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.petTypeSynchronizer.syncToNeo4j(change.fullDocument as Hydrate<PetType>);
              break;
            case 'delete':
              await this.petTypeSynchronizer.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync petType to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${PetTypeListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${PetTypeListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${PetTypeListenerService.name}`);

        await this.handleStreamClosing(PetTypeListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${PetTypeListenerService.name}`);
      });
  }
}
