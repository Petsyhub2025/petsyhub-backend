import { Test, TestingModule } from '@nestjs/testing';
import { FoundPostsController } from './found-posts.controller';

describe('FoundPostsController', () => {
  let controller: FoundPostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoundPostsController],
    }).compile();

    controller = module.get<FoundPostsController>(FoundPostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
