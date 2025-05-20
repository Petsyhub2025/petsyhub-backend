import { Test, TestingModule } from '@nestjs/testing';
import { PetTypesService } from './pet-types.service';

describe('PetTypesService', () => {
  let service: PetTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetTypesService],
    }).compile();

    service = module.get<PetTypesService>(PetTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
