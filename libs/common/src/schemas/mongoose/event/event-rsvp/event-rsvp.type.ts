import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsInstance, IsString, IsEnum } from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { EventRsvpResponseEnum } from './event-rsvp.enum';

export class EventRsvp extends BaseModel<EventRsvp> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  user: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  event: Types.ObjectId;

  @IsString()
  @IsEnum(EventRsvpResponseEnum)
  response: EventRsvpResponseEnum;

  // Internal use
  $response?: EventRsvpResponseEnum;
}

export interface IEventRsvpInstanceMethods extends IBaseInstanceMethods {}
export interface IEventRsvpModel extends Model<EventRsvp, Record<string, unknown>, IEventRsvpInstanceMethods> {}
