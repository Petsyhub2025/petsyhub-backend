import { Test, TestingModule } from '@nestjs/testing';
import { UserTopicService } from './user-topic.service';

describe('UserTopicService', () => {
  let service: UserTopicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserTopicService],
    }).compile();

    service = module.get<UserTopicService>(UserTopicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
