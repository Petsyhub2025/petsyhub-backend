import {
  Event,
  IsDateAfterNow,
  IsDateFromTimestamp,
  IsMediaUploadFileValid,
  LocationDto,
  MediaUploadFile,
  TransformObjectId,
  TransformObjectIds,
  TransformTimeStamp,
} from '@instapets-backend/common';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsInstance,
  IsObject,
  IsOptional,
  IsString,
  MaxDate,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { IsStartDateBelowEndDate } from '@events/user/controllers/events/validations';

export class PlaceLocationDto extends LocationDto {
  @IsOptional()
  @IsString()
  extraAddressDetails?: string;
}

export class AllowedPetTypesDto {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  petTypeId: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  specificPetBreedIds?: Types.ObjectId[];
}

export class CreateEventDto extends PickType(Event, [
  'title',
  'description',
  'type',
  'capacity',
  'disableRsvpAtFullCapacity',
  'pricingInformation',
] as const) {
  @IsDateFromTimestamp()
  @IsDateAfterNow()
  @MaxDate(new Date(4133023200000)) // 2100-01-01
  @TransformTimeStamp()
  @ApiProperty({ type: 'number' })
  @Validate(IsStartDateBelowEndDate)
  startDate: Date;

  @IsDateFromTimestamp()
  @IsDateAfterNow()
  @MaxDate(new Date(4133023200000)) // 2100-01-01
  @TransformTimeStamp()
  @ApiProperty({ type: 'number' })
  endDate: Date;

  @IsObject()
  @ValidateNested()
  placeLocation: PlaceLocationDto;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AllowedPetTypesDto)
  allowedPetTypes: AllowedPetTypesDto[];

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  categoryId: Types.ObjectId;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  facilityIds: Types.ObjectId[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @IsMediaUploadFileValid({ s3Only: true }, { each: true })
  @Type(() => MediaUploadFile)
  mediaUploads: MediaUploadFile[];
}
