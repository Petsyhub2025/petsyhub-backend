import { Test, TestingModule } from '@nestjs/testing';
import { AuthErrorService } from './auth-error.service';

describe('AuthErrorService', () => {
  let service: AuthErrorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthErrorService],
    }).compile();

    service = module.get<AuthErrorService>(AuthErrorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
