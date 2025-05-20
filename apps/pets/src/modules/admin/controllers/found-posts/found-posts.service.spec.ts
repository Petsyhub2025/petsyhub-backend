import { Test, TestingModule } from '@nestjs/testing';
import { FoundPostsService } from './found-posts.service';

describe('FoundPostsService', () => {
  let service: FoundPostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoundPostsService],
    }).compile();

    service = module.get<FoundPostsService>(FoundPostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
