import { ModelNames } from '@common/constants';
import { branchServiceTypeSchemaFactory } from '@common/schemas/mongoose/branch/branch-service-type';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const branchServiceTypeMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BRANCH_SERVICE_TYPE,
  inject: [getConnectionToken()],
  useFactory: branchServiceTypeSchemaFactory,
};

const branchServiceTypeProviders = [branchServiceTypeMongooseDynamicModule];

@Module({
  imports: [],
  providers: branchServiceTypeProviders,
  exports: branchServiceTypeProviders,
})
export class BranchServiceTypeMongooseModule {}
