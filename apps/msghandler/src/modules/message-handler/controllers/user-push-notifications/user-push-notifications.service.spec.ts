import { Test, TestingModule } from '@nestjs/testing';
import { UserPushNotificationsService } from './user-push-notifications.service';

describe('UserPushNotificationsService', () => {
  let service: UserPushNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPushNotificationsService],
    }).compile();

    service = module.get<UserPushNotificationsService>(UserPushNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
