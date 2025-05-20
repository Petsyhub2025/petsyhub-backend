import { BasePaginationQuery, LikeType } from '@instapets-backend/common';
import { IsEnum } from 'class-validator';

export class GetLikersQueryDto extends BasePaginationQuery {
  @IsEnum(LikeType)
  likeType: LikeType;
}
