import { Test, TestingModule } from '@nestjs/testing';
import { AppVersionsService } from './app-versions.service';

describe('AppVersionsService', () => {
  let service: AppVersionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppVersionsService],
    }).compile();

    service = module.get<AppVersionsService>(AppVersionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
