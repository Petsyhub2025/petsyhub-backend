import { TransformArray } from '@instapets-backend/common';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class CalculateUserCountByUserSegmentsQueryDto {
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  @TransformArray()
  userSegmentIds: string[];
}
