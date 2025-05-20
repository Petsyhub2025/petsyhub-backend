import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ModelNames } from '@common/constants';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { AdminRoleEventsEnum } from '../admin-role.enum';
import { AdminRole } from '../admin-role.type';
import { IAdminModel } from '../../admin.type';

@Injectable()
export class AdminRolesEventListener {
  constructor(
    @Inject(forwardRef(() => ModelNames.ADMIN)) private adminModel: IAdminModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
  ) {}

  @OnEvent(AdminRoleEventsEnum.POST_SAVE_UPDATE_ADMIN_ROLES, { promisify: true })
  async updateAdminRoles(event: HydratedDocument<AdminRole>) {
    return this.errorHandler.eventListenerErrorHandler(AdminRoleEventsEnum.POST_SAVE_UPDATE_ADMIN_ROLES, async () => {
      await this.adminModel.updateMany(
        {
          'role._id': event._id,
        },
        {
          role: event.toObject(),
        },
      );
    });
  }
}
