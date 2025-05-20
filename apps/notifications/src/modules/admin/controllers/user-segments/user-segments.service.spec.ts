import { Test, TestingModule } from '@nestjs/testing';
import { UserSegmentsService } from './user-segments.service';

describe('UserSegmentsService', () => {
  let service: UserSegmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSegmentsService],
    }).compile();

    service = module.get<UserSegmentsService>(UserSegmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
