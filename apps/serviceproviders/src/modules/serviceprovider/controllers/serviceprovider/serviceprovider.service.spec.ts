import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderProfileService } from './serviceprovider.service';

describe('ServiceProviderProfileService', () => {
  let service: ServiceProviderProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceProviderProfileService],
    }).compile();

    service = module.get<ServiceProviderProfileService>(ServiceProviderProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
