import { Test, TestingModule } from '@nestjs/testing';
import { ElasticSearchMigrationService } from './elastic-search-migration.service';

describe('ElasticSearchMigrationService', () => {
  let service: ElasticSearchMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElasticSearchMigrationService],
    }).compile();

    service = module.get<ElasticSearchMigrationService>(ElasticSearchMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
