import { Test, TestingModule } from '@nestjs/testing';
import { PetBreedsController } from './pet-breeds.controller';

describe('PetBreedsController', () => {
  let controller: PetBreedsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetBreedsController],
    }).compile();

    controller = module.get<PetBreedsController>(PetBreedsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
