import { Test, TestingModule } from '@nestjs/testing';
import { LostPostsService } from './lost-posts.service';

describe('LostPostsService', () => {
  let service: LostPostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LostPostsService],
    }).compile();

    service = module.get<LostPostsService>(LostPostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
