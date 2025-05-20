import { Test, TestingModule } from '@nestjs/testing';
import { LostPostsController } from './lost-posts.controller';

describe('LostPostsController', () => {
  let controller: LostPostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LostPostsController],
    }).compile();

    controller = module.get<LostPostsController>(LostPostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
