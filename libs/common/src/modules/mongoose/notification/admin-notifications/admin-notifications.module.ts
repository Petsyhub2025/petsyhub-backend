import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '../../common';
import { adminNotificationSchemaFactory } from '@common/schemas/mongoose/notification/admin-notification';

const AdminNotificationMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.ADMIN_NOTIFICATION,
  useFactory: adminNotificationSchemaFactory,
  inject: [getConnectionToken()],
};

const adminNotificationProviders = [AdminNotificationMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  exports: [...adminNotificationProviders],
  providers: [...adminNotificationProviders],
})
export class AdminNotificationMongooseModule {}
