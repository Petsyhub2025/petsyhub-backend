import { ModelNames } from '@common/constants';
import { adminFCMTokenSchemaFactory } from '@common/schemas/mongoose/admin/admin-fcm-token';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const AdminFCMTokenMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.ADMIN_FCM_TOKEN,
  inject: [getConnectionToken()],
  useFactory: adminFCMTokenSchemaFactory,
};

const adminFCMTokenProviders = [AdminFCMTokenMongooseDynamicModule];

@Module({
  exports: [...adminFCMTokenProviders],
  providers: [...adminFCMTokenProviders],
})
export class AdminFCMTokenMongooseModule {}
