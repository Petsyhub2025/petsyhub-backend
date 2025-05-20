import { Test, TestingModule } from '@nestjs/testing';
import { UserTopicController } from './user-topic.controller';

describe('UserTopicController', () => {
  let controller: UserTopicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTopicController],
    }).compile();

    controller = module.get<UserTopicController>(UserTopicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
