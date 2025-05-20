import { Test, TestingModule } from '@nestjs/testing';
import { MedicalSpecialtyService } from './medical-specialty.service';

describe('MedicalSpecialtyService', () => {
  let service: MedicalSpecialtyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalSpecialtyService],
    }).compile();

    service = module.get<MedicalSpecialtyService>(MedicalSpecialtyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
