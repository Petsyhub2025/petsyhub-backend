import { IsMongoId } from 'class-validator';

export class EventIdParamDto {
  @IsMongoId()
  eventId: string;
}
