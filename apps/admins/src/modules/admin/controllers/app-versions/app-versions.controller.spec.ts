import { Test, TestingModule } from '@nestjs/testing';
import { AppVersionsController } from './app-versions.controller';

describe('AppVersionsController', () => {
  let controller: AppVersionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppVersionsController],
    }).compile();

    controller = module.get<AppVersionsController>(AppVersionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
