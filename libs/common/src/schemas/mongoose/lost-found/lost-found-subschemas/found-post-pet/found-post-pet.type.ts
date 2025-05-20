import { TransformObjectId } from '@common/decorators/class-transformer';
import { PetGenderEnum } from '@common/schemas/mongoose/pet/pet.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInstance, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

export class FoundPostPetSubSchemaType {
  @IsOptional()
  @IsString()
  @IsEnum(PetGenderEnum)
  gender?: PetGenderEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  type: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  breed?: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  @Max(200)
  @Min(1)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Max(500)
  weight?: number;
}
