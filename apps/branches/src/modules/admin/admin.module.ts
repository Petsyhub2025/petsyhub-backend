import { Module } from '@nestjs/common';
import { SharedModule } from '@branches/shared/shared.module';
import { BranchServiceTypesService } from './controllers/branch-service-types/branch-service-types.service';
import { BranchServiceTypesController } from './controllers/branch-service-types/branch-service-types.controller';
import { MedicalSpecialtyController } from './controllers/medical-specialties/medical-specialty.controller';
import { MedicalSpecialtyService } from './controllers/medical-specialties/medical-specialty.service';
import { BranchesService } from '@branches/admin/controllers/branches/branches.service';
import { BranchesController } from '@branches/admin/controllers/branches/branches.controller';
import { BranchAccessRoleService } from './controllers/branch-access-role/branch-access-role.service';
import { BranchAccessRoleController } from './controllers/branch-access-role/branch-access-role.controller';
import {
  BranchAccessControlMongooseModule,
  ServiceProviderMongooseModule,
  TemplateManagerService,
} from '@instapets-backend/common';

@Module({
  imports: [SharedModule, BranchAccessControlMongooseModule, ServiceProviderMongooseModule],
  controllers: [
    BranchServiceTypesController,
    MedicalSpecialtyController,
    BranchesController,
    BranchAccessRoleController,
  ],
  providers: [
    BranchServiceTypesService,
    MedicalSpecialtyService,
    BranchesService,
    BranchAccessRoleService,
    TemplateManagerService,
  ],
})
export class AdminModule {}
