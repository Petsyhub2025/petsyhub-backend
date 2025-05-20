import { Test, TestingModule } from '@nestjs/testing';
import { EventFacilitiesService } from './event-facilities.service';

describe('EventFacilitiesService', () => {
  let service: EventFacilitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventFacilitiesService],
    }).compile();

    service = module.get<EventFacilitiesService>(EventFacilitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
