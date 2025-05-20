import { PartialType, PickType } from '@nestjs/swagger';
import { EventCategory } from '@instapets-backend/common';

export class UpdateEventCategoryDto extends PartialType(PickType(EventCategory, ['name'] as const)) {}
