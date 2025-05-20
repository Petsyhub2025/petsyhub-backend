import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { IsPricingInformationProvidedWhenPaid } from '@common/decorators/class-validator/events';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInstance,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsDate,
  IsObject,
  ValidateNested,
  IsEnum,
  IsOptional,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  ArrayMinSize,
  IsNumber,
  Max,
  IsBoolean,
  Validate,
  IsUUID,
} from 'class-validator';
import { Types, Model } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';
import { EventAllowedPetTypeSubSchemaType } from './event-subschemas/event-allowed-pet-type';
import { EventPlaceLocationSubSchemaType } from './event-subschemas/event-place-location';
import { EventTypeEnum, EventStatusEnum } from './event.enum';

export class Event extends BaseModel<Event> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorUser: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  description: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsObject()
  @ValidateNested()
  placeLocation: EventPlaceLocationSubSchemaType;

  @IsString()
  @IsEnum(EventTypeEnum)
  type: EventTypeEnum;

  @IsOptional()
  @IsDate()
  cancelledAt?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cancellationReason?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => Media)
  media: Media[];

  @IsOptional()
  @IsUUID()
  mediaProcessingId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => EventAllowedPetTypeSubSchemaType)
  allowedPetTypes: EventAllowedPetTypeSubSchemaType[];

  @IsOptional()
  @IsNumber()
  @Max(1000000)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  disableRsvpAtFullCapacity?: boolean;

  @Validate(IsPricingInformationProvidedWhenPaid)
  pricingInformation?: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  category: Types.ObjectId;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  facilities: Types.ObjectId[];

  @IsNumber()
  totalInterested: number;

  @IsNumber()
  totalGoing: number;
}

export interface IEventVirtuals {
  status: EventStatusEnum;
}
export interface IEventInstanceMethods extends IBaseInstanceMethods {
  cancelDoc: (cancellationReason?: string) => Promise<void>;
}
export interface IEventModel extends Model<Event, Record<string, unknown>, IEventInstanceMethods, IEventVirtuals> {}
