import { ModelNames } from '@common/constants';
import { UserBlockHelperService } from '@common/schemas/mongoose/user/user-block/services';
import { userBlockSchemaFactory } from '@common/schemas/mongoose/user/user-block/user-block.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';

const UserBlockMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_BLOCK,
  inject: [getConnectionToken(), EventEmitter2],
  useFactory: userBlockSchemaFactory,
};

const userBlockProviders = [UserBlockMongooseDynamicModule, UserBlockHelperService];

@Module({
  imports: [],
  providers: userBlockProviders,
  exports: userBlockProviders,
})
export class UserBlockMongooseModule {}
