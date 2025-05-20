import { PickType } from '@nestjs/swagger';
import { EventFacility } from '@instapets-backend/common';

export class CreateEventFacilityDto extends PickType(EventFacility, ['name'] as const) {}
