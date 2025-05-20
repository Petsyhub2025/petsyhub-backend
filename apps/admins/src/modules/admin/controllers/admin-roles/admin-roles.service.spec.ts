import { Test, TestingModule } from '@nestjs/testing';
import { AdminRolesService } from './admin-roles-roles.service';

describe('AdminService', () => {
  let service: AdminRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRolesService],
    }).compile();

    service = module.get<AdminRolesService>(AdminRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
