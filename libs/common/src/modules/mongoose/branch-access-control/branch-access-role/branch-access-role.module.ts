import { ModelNames } from '@common/constants';
import { branchAccessRoleSchemaFactory } from '@common/schemas/mongoose/branch-access-control/branch-access-role/index';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const BranchAccessRolesMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BRANCH_ACCESS_ROLE,
  inject: [getConnectionToken()],
  useFactory: branchAccessRoleSchemaFactory,
};

const branchAccessRolesProviders = [BranchAccessRolesMongooseDynamicModule];

@Module({
  imports: [],
  providers: branchAccessRolesProviders,
  exports: branchAccessRolesProviders,
})
export class BranchAccessRolesMongooseModule {}
