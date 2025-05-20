import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderAuthController } from './serviceprovider-auth.controller';

describe('ServiceProviderAuthController', () => {
  let controller: ServiceProviderAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceProviderAuthController],
    }).compile();

    controller = module.get<ServiceProviderAuthController>(ServiceProviderAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
