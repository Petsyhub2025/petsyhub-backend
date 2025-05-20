import { IsMongoId } from 'class-validator';

export class UserSegmentIdParamDto {
  @IsMongoId()
  userSegmentId: string;
}
