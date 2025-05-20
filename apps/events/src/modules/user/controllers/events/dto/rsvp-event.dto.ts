import { EventRsvpResponseEnum } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export class RsvpEventDto {
  @IsString()
  @IsEnum(EventRsvpResponseEnum)
  response: EventRsvpResponseEnum;
}
