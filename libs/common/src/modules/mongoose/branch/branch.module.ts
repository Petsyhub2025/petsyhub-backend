import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { baseBranchSchemaFactory } from '@common/schemas/mongoose/branch/base-branch.schema';
import { clinicBranchSchemaFactory } from '@common/schemas/mongoose/branch/clinic-branch/clinic-branch.schema';
import { BranchEventListener } from '@common/schemas/mongoose/branch/branch-event-listener';
import { MongooseCommonModule } from '@common/modules/mongoose/common/index';
import { BrandMongooseModule } from '@common/modules/mongoose/brand';
import { shopBranchSchemaFactory } from '@common/schemas/mongoose/branch/shop-branch';
import { dayCareBranchSchemaFactory } from '@common/schemas/mongoose/branch/daycare-branch';
import { hostelBranchSchemaFactory } from '@common/schemas/mongoose/branch/hostel-branch';
import { spaBranchSchemaFactory } from '@common/schemas/mongoose/branch/spa-branch';

const BranchMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_BRANCH,
  inject: [getConnectionToken(), EventEmitter2],
  useFactory: baseBranchSchemaFactory,
};

const branchDiscriminatorProviders: FactoryProvider[] = [
  {
    provide: ModelNames.CLINIC_BRANCH,
    inject: [ModelNames.BASE_BRANCH],
    useFactory: clinicBranchSchemaFactory,
  },
  {
    provide: ModelNames.SHOP_BRANCH,
    inject: [ModelNames.BASE_BRANCH],
    useFactory: shopBranchSchemaFactory,
  },
  {
    provide: ModelNames.DAYCARE_BRANCH,
    inject: [ModelNames.BASE_BRANCH],
    useFactory: dayCareBranchSchemaFactory,
  },
  {
    provide: ModelNames.HOSTEL_BRANCH,
    inject: [ModelNames.BASE_BRANCH],
    useFactory: hostelBranchSchemaFactory,
  },
  {
    provide: ModelNames.SPA_BRANCH,
    inject: [ModelNames.BASE_BRANCH],
    useFactory: spaBranchSchemaFactory,
  },
];

const branchProviders = [BranchMongooseDynamicModule, ...branchDiscriminatorProviders, BranchEventListener];

@Module({
  imports: [MongooseCommonModule.forRoot(), BrandMongooseModule],
  providers: branchProviders,
  exports: branchProviders,
})
export class BranchMongooseModule {}
