import { Module } from '@nestjs/common';
import { SharedModule } from '@events/shared/shared.module';
import { EventFacilitiesController } from './controllers/event-facilities/event-facilities.controller';
import { EventFacilitiesService } from './controllers/event-facilities/event-facilities.service';
import { EventCategoriesController } from './controllers/event-categories/event-categories.controller';
import { EventCategoriesService } from './controllers/event-categories/event-categories.service';

@Module({
  imports: [SharedModule],
  controllers: [EventFacilitiesController, EventCategoriesController],
  providers: [EventFacilitiesService, EventCategoriesService],
})
export class AdminModule {}
