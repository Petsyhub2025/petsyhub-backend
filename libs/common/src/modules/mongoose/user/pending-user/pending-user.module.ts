import { ModelNames } from '@common/constants';
import { pendingUserSchemaFactory } from '@common/schemas/mongoose/user/pending-user';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PendingUserMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PENDING_USER,
  inject: [getConnectionToken()],
  useFactory: pendingUserSchemaFactory,
};

const pendingUserProviders = [PendingUserMongooseDynamicModule];

@Module({
  imports: [],
  providers: pendingUserProviders,
  exports: pendingUserProviders,
})
export class PendingUserMongooseModule {}
