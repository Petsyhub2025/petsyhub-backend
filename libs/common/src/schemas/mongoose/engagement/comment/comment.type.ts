import { TransformObjectId } from '@common/decorators/class-transformer';
import { IsDate, IsInstance, IsNumber, IsOptional, IsString } from 'class-validator';
import { Model, Types } from 'mongoose';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class Comment extends BaseModel<Comment> {
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  authorUser: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  post: Types.ObjectId;

  @IsString()
  body: string;

  @IsOptional()
  @IsNumber()
  totalLikes?: number;

  @IsOptional()
  @IsNumber()
  totalReplies?: number;

  @IsOptional()
  @IsNumber()
  totalReports?: number;

  @IsOptional()
  @IsDate()
  suspendedDueToPostSuspensionAt?: Date;
}

export interface ICommentInstanceMethods extends IBaseInstanceMethods {
  suspendDocDueToPostSuspension: () => Promise<void>;
  unSuspendDocDueToPostSuspension: () => Promise<void>;
}
export interface ICommentModel extends Model<Comment, Record<string, unknown>, ICommentInstanceMethods> {}
