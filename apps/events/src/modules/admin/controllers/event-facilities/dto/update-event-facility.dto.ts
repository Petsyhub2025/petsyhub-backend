import { PartialType, PickType } from '@nestjs/swagger';
import { EventFacility } from '@instapets-backend/common';

export class UpdateEventFacilityDto extends PartialType(PickType(EventFacility, ['name'] as const)) {}
