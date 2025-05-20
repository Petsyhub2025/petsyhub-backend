import { Test, TestingModule } from '@nestjs/testing';
import { BranchServiceTypesController } from './branch-service-types.controller';

describe('BranchServiceTypesController', () => {
  let controller: BranchServiceTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchServiceTypesController],
    }).compile();

    controller = module.get<BranchServiceTypesController>(BranchServiceTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
