import { ModelNames } from '@common/constants';
import { pendingUserFollowSchemaFactory } from '@common/schemas/mongoose/user/pending-user-follow';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const PendingUserFollowMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.PENDING_USER_FOLLOW,
  inject: [getConnectionToken()],
  useFactory: pendingUserFollowSchemaFactory,
};

const userFollowProviders = [PendingUserFollowMongooseDynamicModule];

@Module({
  imports: [],
  providers: userFollowProviders,
  exports: userFollowProviders,
})
export class PendingUserFollowMongooseModule {}
