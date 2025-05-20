import { Test, TestingModule } from '@nestjs/testing';
import { EventFacilitiesController } from './event-facilities.controller';

describe('EventFacilitiesController', () => {
  let controller: EventFacilitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventFacilitiesController],
    }).compile();

    controller = module.get<EventFacilitiesController>(EventFacilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
