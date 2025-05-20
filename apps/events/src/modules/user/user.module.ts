import { Module } from '@nestjs/common';
import { SharedModule } from '@events/shared/shared.module';
import { AppConfig, AwsS3Module, UserBlockMongooseModule } from '@instapets-backend/common';
import { EventsController } from './controllers/events/events.controller';
import { EventFacilitiesController } from './controllers/event-facilities/event-facilities.controller';
import { EventCategoriesController } from './controllers/event-categories/event-categories.controller';
import { EventsService } from './controllers/events/events.service';
import { EventFacilitiesService } from './controllers/event-facilities/event-facilities.service';
import { EventCategoriesService } from './controllers/event-categories/event-categories.service';
import { EventEventListener } from './event-listeners/event.listener';

@Module({
  imports: [SharedModule, UserBlockMongooseModule],
  controllers: [EventsController, EventFacilitiesController, EventCategoriesController],
  providers: [EventsService, EventFacilitiesService, EventCategoriesService, EventEventListener],
})
export class UserModule {}
