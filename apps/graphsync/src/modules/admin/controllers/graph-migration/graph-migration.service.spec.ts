import { Test, TestingModule } from '@nestjs/testing';
import { GraphMigrationService } from './graph-migration.service';

describe('GraphMigrationService', () => {
  let service: GraphMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GraphMigrationService],
    }).compile();

    service = module.get<GraphMigrationService>(GraphMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
