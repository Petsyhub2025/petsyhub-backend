import { BasePaginationQuery } from '@instapets-backend/common';
import { IsMongoId, IsOptional } from 'class-validator';

export class GetPetPendingFollowersQueryDto extends BasePaginationQuery {
  @IsOptional()
  @IsMongoId()
  petId?: string;
}
