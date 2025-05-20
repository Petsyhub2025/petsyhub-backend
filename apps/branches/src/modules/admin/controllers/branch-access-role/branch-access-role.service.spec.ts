import { Test, TestingModule } from '@nestjs/testing';
import { BranchAccessRoleService } from './branch-access-role.service';

describe('BranchAccessRoleService', () => {
  let service: BranchAccessRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchAccessRoleService],
    }).compile();

    service = module.get<BranchAccessRoleService>(BranchAccessRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
