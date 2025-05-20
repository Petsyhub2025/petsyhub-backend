import { Test, TestingModule } from '@nestjs/testing';
import { DynamicLinksController } from './dynamic-links.controller';

describe('DynamicLinksController', () => {
  let controller: DynamicLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicLinksController],
    }).compile();

    controller = module.get<DynamicLinksController>(DynamicLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
