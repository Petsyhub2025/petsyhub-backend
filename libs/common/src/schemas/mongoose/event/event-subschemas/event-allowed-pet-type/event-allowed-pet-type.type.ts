import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInstance, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class EventAllowedPetTypeSubSchemaType {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  petType: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  @ApiProperty({ type: [String] })
  specificPetBreeds?: Types.ObjectId[];
}
