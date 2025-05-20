import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderAuthService } from './serviceprovider-auth.service';

describe('ServiceProviderAuthService', () => {
  let service: ServiceProviderAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceProviderAuthService],
    }).compile();

    service = module.get<ServiceProviderAuthService>(ServiceProviderAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
