import { BaseSearchPaginationQuery } from '@common/dtos';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetUserPushNotificationsQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsMongoId()
  userSegmentId: string;

  @IsOptional()
  @IsMongoId()
  dynamicLinkId: string;
}
