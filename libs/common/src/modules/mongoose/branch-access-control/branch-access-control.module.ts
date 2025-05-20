import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';
import { branchAccessControlSchemaFactory } from '@common/schemas/mongoose/branch-access-control/branch-access-control.schema';

const BranchAccessControlMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BRANCH_ACCESS_CONTROL,
  inject: [getConnectionToken()],
  useFactory: branchAccessControlSchemaFactory,
};

const branchAccessControlProviders = [BranchAccessControlMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: branchAccessControlProviders,
  exports: branchAccessControlProviders,
})
export class BranchAccessControlMongooseModule {}
