import { Test, TestingModule } from '@nestjs/testing';
import { UserSegmentsController } from './user-segments.controller';

describe('UserSegmentsController', () => {
  let controller: UserSegmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSegmentsController],
    }).compile();

    controller = module.get<UserSegmentsController>(UserSegmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
