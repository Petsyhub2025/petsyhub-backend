import { Test, TestingModule } from '@nestjs/testing';
import { GraphMigrationController } from './graph-migration.controller';

describe('GraphMigrationController', () => {
  let controller: GraphMigrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GraphMigrationController],
    }).compile();

    controller = module.get<GraphMigrationController>(GraphMigrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
