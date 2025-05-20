import { Test, TestingModule } from '@nestjs/testing';
import { ElasticSearchHelperService } from './elastic-search-helper.service';

describe('ElasticSearchHelperService', () => {
  let service: ElasticSearchHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElasticSearchHelperService],
    }).compile();

    service = module.get<ElasticSearchHelperService>(ElasticSearchHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
