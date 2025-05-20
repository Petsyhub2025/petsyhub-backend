import { BasePaginationQuery, EventRsvpResponseEnum } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export class GetUserRsvpedEventsQueryDto extends BasePaginationQuery {
  @IsString()
  @IsEnum(EventRsvpResponseEnum)
  response: EventRsvpResponseEnum;
}
