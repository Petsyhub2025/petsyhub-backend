import { Test, TestingModule } from '@nestjs/testing';
import { MedicalSpecialtyController } from './medical-specialty.controller';

describe('MedicalSpecialtyController', () => {
  let controller: MedicalSpecialtyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalSpecialtyController],
    }).compile();

    controller = module.get<MedicalSpecialtyController>(MedicalSpecialtyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
