import { Test, TestingModule } from '@nestjs/testing';
import { BranchServiceTypesService } from './branch-service-types.service';

describe('BranchServiceTypesService', () => {
  let service: BranchServiceTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchServiceTypesService],
    }).compile();

    service = module.get<BranchServiceTypesService>(BranchServiceTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
