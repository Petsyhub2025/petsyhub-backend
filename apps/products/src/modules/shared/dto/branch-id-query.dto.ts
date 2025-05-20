import { TransformObjectId } from '@instapets-backend/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInstance, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class BranchIdQueryDto {
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiPropertyOptional({ type: String })
  branchId?: Types.ObjectId;
}
