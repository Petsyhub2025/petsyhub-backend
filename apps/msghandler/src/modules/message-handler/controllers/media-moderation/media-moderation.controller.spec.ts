import { Test, TestingModule } from '@nestjs/testing';
import { MediaModerationController } from './media-moderation.controller';

describe('MediaModerationController', () => {
  let controller: MediaModerationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaModerationController],
    }).compile();

    controller = module.get<MediaModerationController>(MediaModerationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
