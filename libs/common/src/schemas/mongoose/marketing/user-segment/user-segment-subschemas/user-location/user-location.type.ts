import { TransformObjectId } from '@common/decorators/class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInstance, ValidateIf } from 'class-validator';
import { Types } from 'mongoose';

export class UserSegmentLocationSubSchemaType {
  @ValidateIf((o) => !!o.country || (o.city == undefined && o.area == undefined))
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String, description: 'Country id' })
  country?: Types.ObjectId;

  @ValidateIf((o) => !!o.city || (o.area == undefined && o.country == undefined))
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String, description: 'City id' })
  city?: Types.ObjectId;

  @ValidateIf((o) => !!o.area || (o.city == undefined && o.country == undefined))
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String, description: 'Area id' })
  area?: Types.ObjectId;
}
