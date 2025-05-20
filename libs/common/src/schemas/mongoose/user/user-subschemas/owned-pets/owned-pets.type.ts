import { TransformObjectId } from '@common/decorators/class-transformer';
import { PetStatusEnum } from '@common/schemas/mongoose/pet/pet.enum';
import { IsEnum, IsInstance, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class OwnedPetsSubSchemaType {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  petId: Types.ObjectId;

  @IsOptional()
  @IsString()
  @IsEnum(PetStatusEnum)
  status?: PetStatusEnum;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  type: Types.ObjectId;
}
