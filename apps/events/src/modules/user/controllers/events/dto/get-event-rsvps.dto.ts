import { BasePaginationQuery, EventRsvpResponseEnum } from '@instapets-backend/common';
import { IsString, IsEnum } from 'class-validator';

export class GetEventRsvpResponsesQueryDto extends BasePaginationQuery {
  @IsString()
  @IsEnum(EventRsvpResponseEnum)
  response: EventRsvpResponseEnum;
}
