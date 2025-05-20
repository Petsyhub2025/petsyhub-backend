import { Test, TestingModule } from '@nestjs/testing';
import { ElasticSearchMigrationController } from './elastic-search-migration.controller';

describe('ElasticSearchMigrationController', () => {
  let controller: ElasticSearchMigrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElasticSearchMigrationController],
    }).compile();

    controller = module.get<ElasticSearchMigrationController>(ElasticSearchMigrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
