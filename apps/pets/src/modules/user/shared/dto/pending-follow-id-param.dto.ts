import { IsMongoId } from 'class-validator';

export class pendingFollowIdParamDto {
  @IsMongoId()
  pendingFollowId: string;
}
