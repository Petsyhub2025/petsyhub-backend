import { Test, TestingModule } from '@nestjs/testing';
import { UserPushNotificationsController } from './user-push-notifications.controller';

describe('UserPushNotificationsController', () => {
  let controller: UserPushNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPushNotificationsController],
    }).compile();

    controller = module.get<UserPushNotificationsController>(UserPushNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
