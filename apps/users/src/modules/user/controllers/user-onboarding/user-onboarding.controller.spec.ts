import { Test, TestingModule } from '@nestjs/testing';
import { UserOnboardingController } from './user-onboarding.controller';

describe('UserOnboardingController', () => {
  let controller: UserOnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserOnboardingController],
    }).compile();

    controller = module.get<UserOnboardingController>(UserOnboardingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
