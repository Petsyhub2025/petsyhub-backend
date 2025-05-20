import { PetIndexHelperService, UserIndexHelperService } from '@elasticsync/admin/shared';
import { Injectable } from '@nestjs/common';
import { IElasticSyncFieldUpdatePropagationEvent, ListenerError, ModelNames } from '@instapets-backend/common';

@Injectable()
export class EventsHandlerService {
  constructor(
    // private readonly logger: CustomLoggerService,
    private readonly petIndexHelperService: PetIndexHelperService,
    private readonly userIndexHelperService: UserIndexHelperService,
  ) {}

  async propagateFieldUpdate({ _id, model }: IElasticSyncFieldUpdatePropagationEvent) {
    if (!model || !_id) {
      throw new ListenerError({
        message: 'Model name is required',
      });
    }

    switch (model) {
      case ModelNames.USER:
        await this.userIndexHelperService.syncDependencies(_id);
        break;
      case ModelNames.PET:
        await this.petIndexHelperService.syncDependencies(_id);
        break;
      default:
        throw new ListenerError({
          message: 'Incomplete propagation request',
        });
    }
  }
}
