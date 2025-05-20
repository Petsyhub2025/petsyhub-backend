import { Test, TestingModule } from '@nestjs/testing';
import { DynamicLinksService } from './dynamic-links.service';

describe('DynamicLinksService', () => {
  let service: DynamicLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamicLinksService],
    }).compile();

    service = module.get<DynamicLinksService>(DynamicLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
