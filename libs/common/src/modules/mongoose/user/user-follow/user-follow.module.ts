import { ModelNames } from '@common/constants';
import { FactoryProvider, Module, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { UserMongooseModule } from '../user.module';
import { UserFollowEventListener } from '@common/schemas/mongoose/user/user-follow/user-follow-event-listener';
import { UserFollowHelperService } from '@common/schemas/mongoose/user/user-follow/user-follow-helper.service';
import { userFollowSchemaFactory } from '@common/schemas/mongoose/user/user-follow/user-follow.schema';

const UserFollowMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_FOLLOW,
  inject: [getConnectionToken(), EventEmitter2],
  useFactory: userFollowSchemaFactory,
};

const userFollowProviders = [UserFollowMongooseDynamicModule, UserFollowEventListener, UserFollowHelperService];

@Module({
  imports: [forwardRef(() => UserMongooseModule)],
  providers: userFollowProviders,
  exports: userFollowProviders,
})
export class UserFollowMongooseModule {}
