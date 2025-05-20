import { PickType } from '@nestjs/swagger';
import { EventCategory } from '@instapets-backend/common';

export class CreateEventCategoryDto extends PickType(EventCategory, ['name'] as const) {}
