import { ModelNames } from '@common/constants';
import { adminSchemaFactory } from '@common/schemas/mongoose/admin/admin.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const AdminMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.ADMIN,
  inject: [getConnectionToken()],
  useFactory: adminSchemaFactory,
};

const adminProviders = [AdminMongooseDynamicModule];

@Module({
  imports: [],
  providers: adminProviders,
  exports: adminProviders,
})
export class AdminMongooseModule {}
