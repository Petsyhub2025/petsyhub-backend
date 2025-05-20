import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { City, CustomLoggerService, ICityModel, ModelNames } from '@instapets-backend/common';
import { CitySynchronizerService } from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';

@Injectable()
export class CityListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly citySynchronizer: CitySynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(CityListenerService.name);

    const changeStream = this.cityModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(CityListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.citySynchronizer.syncToNeo4j(change.fullDocument as Hydrate<City>);
              break;
            case 'delete':
              await this.citySynchronizer.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync city to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${CityListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${CityListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${CityListenerService.name}`);

        await this.handleStreamClosing(CityListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${CityListenerService.name}`);
      });
  }
}
