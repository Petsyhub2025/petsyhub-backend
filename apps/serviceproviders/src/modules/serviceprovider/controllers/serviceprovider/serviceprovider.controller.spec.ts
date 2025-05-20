import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderProfileController } from './serviceprovider.controller';

describe('ServiceProviderProfileController', () => {
  let controller: ServiceProviderProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceProviderProfileController],
    }).compile();

    controller = module.get<ServiceProviderProfileController>(ServiceProviderProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
