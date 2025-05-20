import { IsMongoId } from 'class-validator';

export class EventFacilityIdParamDto {
  @IsMongoId()
  eventFacilityId: string;
}
