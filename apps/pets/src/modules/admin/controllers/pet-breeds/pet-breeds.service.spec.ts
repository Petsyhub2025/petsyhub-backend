import { Test, TestingModule } from '@nestjs/testing';
import { PetBreedsService } from './pet-breeds.service';

describe('PetBreedsService', () => {
  let service: PetBreedsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetBreedsService],
    }).compile();

    service = module.get<PetBreedsService>(PetBreedsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
