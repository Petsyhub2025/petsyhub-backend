import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Model, Types } from 'mongoose';
import { PetStatusEnum } from '@common/schemas/mongoose/pet/pet.enum';
import { UserSegmentLocationSubSchemaType } from './user-segment-subschemas/user-location';
import { UserSegmentDeviceSubSchemaType } from './user-segment-subschemas/user-device';
import { MinMaxRange } from '@common/schemas/mongoose/common/min-max-range';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInstance,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TransformObjectIds } from '@common/decorators/class-transformer';
import { IsArrayUnique } from '@common/decorators/class-validator/common';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserSegment extends BaseModel<UserSegment> {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiPropertyOptional({ type: [String], description: 'Array of pet types ids' })
  petTypes?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsArrayUnique()
  @IsString({ each: true })
  @IsEnum(PetStatusEnum, { each: true })
  petStatuses?: PetStatusEnum[];

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => UserSegmentLocationSubSchemaType)
  locations?: UserSegmentLocationSubSchemaType[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  devices?: UserSegmentDeviceSubSchemaType;

  @IsOptional()
  @IsBoolean()
  hasAttendedEvents?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHostedEvents?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  totalPets?: MinMaxRange;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  totalFollowers?: MinMaxRange;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  age?: MinMaxRange;

  @IsBoolean()
  isArchived?: boolean;
}

export interface IUserSegmentInstanceMethods extends IBaseInstanceMethods {}
export interface IUserSegmentModel extends Model<UserSegment, Record<string, unknown>, IUserSegmentInstanceMethods> {}
