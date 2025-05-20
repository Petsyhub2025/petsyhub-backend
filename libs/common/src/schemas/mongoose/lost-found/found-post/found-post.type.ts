import { IsObject, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';
import { BaseLostFoundPost, IBaseLostFoundPostInstanceMethods } from '../base-lost-found-post.type';
import { FoundPostPetSubSchemaType } from '../lost-found-subschemas/found-post-pet';

export class FoundPost extends BaseLostFoundPost {
  @IsObject()
  @ValidateNested()
  foundPet: FoundPostPetSubSchemaType;
}

export interface IFoundPostInstanceMethods extends IBaseLostFoundPostInstanceMethods {}
export interface IFoundPostModel extends Model<FoundPost, Record<string, unknown>, IFoundPostInstanceMethods> {}
