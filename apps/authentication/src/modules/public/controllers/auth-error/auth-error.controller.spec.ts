import { Test, TestingModule } from '@nestjs/testing';
import { AuthErrorController } from './auth-error.controller';

describe('AuthErrorController', () => {
  let controller: AuthErrorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthErrorController],
    }).compile();

    controller = module.get<AuthErrorController>(AuthErrorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
