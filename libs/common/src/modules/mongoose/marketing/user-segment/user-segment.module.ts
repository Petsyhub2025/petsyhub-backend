import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { userSegmentSchemaFactory } from '@common/schemas/mongoose/marketing/user-segment/user-segment.schema';
import { UserSegmentHelperService } from '@common/schemas/mongoose/marketing/user-segment/services';

const userSegmentMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.USER_SEGMENT,
  inject: [getConnectionToken()],
  useFactory: userSegmentSchemaFactory,
};

const providers = [userSegmentMongooseDynamicModule, UserSegmentHelperService];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: providers,
  exports: providers,
})
export class UserSegmentMongooseModule {}
