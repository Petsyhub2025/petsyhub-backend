import { LikeType } from '@instapets-backend/common';
import { IsEnum } from 'class-validator';

export class UnLikeObjectQueryDto {
  @IsEnum(LikeType)
  likeType: LikeType;
}
