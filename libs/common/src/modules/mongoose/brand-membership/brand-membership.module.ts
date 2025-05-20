import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { brandMembershipSchemaFactory } from '@common/schemas/mongoose/brand-membership/brand-membership.schema';

const BrandMembershipMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BRAND_MEMBERSHIP,
  inject: [getConnectionToken()],
  useFactory: brandMembershipSchemaFactory,
};

const brandMembershipProviders = [BrandMembershipMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: brandMembershipProviders,
  exports: brandMembershipProviders,
})
export class BrandMembershipMongooseModule {}
