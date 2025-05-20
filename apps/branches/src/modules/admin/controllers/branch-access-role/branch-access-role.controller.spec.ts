import { Test, TestingModule } from '@nestjs/testing';
import { BranchAccessRoleController } from './branch-access-role.controller';

describe('BranchAccessRoleController', () => {
  let controller: BranchAccessRoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchAccessRoleController],
    }).compile();

    controller = module.get<BranchAccessRoleController>(BranchAccessRoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
