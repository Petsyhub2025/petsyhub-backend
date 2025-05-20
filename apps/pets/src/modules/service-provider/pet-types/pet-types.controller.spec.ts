import { Test, TestingModule } from '@nestjs/testing';
import { PetTypesController } from './pet-types.controller';

describe('PetTypesController', () => {
  let controller: PetTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetTypesController],
    }).compile();

    controller = module.get<PetTypesController>(PetTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
