import { Test, TestingModule } from '@nestjs/testing';
import { MediaModerationService } from './media-moderation.service';

describe('MediaModerationService', () => {
  let service: MediaModerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaModerationService],
    }).compile();

    service = module.get<MediaModerationService>(MediaModerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
