import { TransformObjectId } from '@common/decorators/class-transformer';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsInstance, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';
import { Model, Types } from 'mongoose';

export class Review extends BaseModel<Review> {
  @IsString()
  @MinLength(10)
  @ApiProperty({ type: String })
  text: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  customer: Types.ObjectId;

  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({ type: Number })
  rating: number;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branch: Types.ObjectId;
}
export interface IReviewInstanceMethods extends IBaseInstanceMethods {}
export interface IReviewModel extends Model<Review, Record<string, unknown>, IReviewInstanceMethods> {}
