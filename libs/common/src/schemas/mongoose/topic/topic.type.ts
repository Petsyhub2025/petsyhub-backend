import { IsInstance, IsObject, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';
import { Model, Types } from 'mongoose';
import { Media } from '@common/schemas/mongoose/common/media';
import { TransformObjectId } from '@common/decorators/class-transformer';

export class Topic extends BaseModel<Topic> {
  @IsObject()
  @ValidateNested()
  name: LocalizedText;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  icon?: Media;

  @IsOptional()
  @IsUUID()
  iconProcessingId?: string;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  creator: Types.ObjectId;
}
export interface ITopicInstanceMethods extends IBaseInstanceMethods {}
export interface ITopicModel extends Model<Topic, Record<string, unknown>, ITopicInstanceMethods> {}
