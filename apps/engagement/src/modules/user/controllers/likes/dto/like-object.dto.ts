import { LikeType } from '@instapets-backend/common';
import { IsEnum } from 'class-validator';

export class LikeObjectQueryDto {
  @IsEnum(LikeType)
  likeType: LikeType;
}
