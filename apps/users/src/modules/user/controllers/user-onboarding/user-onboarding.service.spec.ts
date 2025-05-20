import { Test, TestingModule } from '@nestjs/testing';
import { UserOnboardingService } from './user-onboarding.service';

describe('UserOnboardingService', () => {
  let service: UserOnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserOnboardingService],
    }).compile();

    service = module.get<UserOnboardingService>(UserOnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
