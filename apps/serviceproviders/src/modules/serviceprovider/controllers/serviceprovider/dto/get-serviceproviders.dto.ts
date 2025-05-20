import { BasePaginationQuery } from '@common/dtos';
import { ServiceProviderStatusEnum, TransformObjectId } from '@instapets-backend/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInstance, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class GetServiceProvidersDto extends BasePaginationQuery {
  @IsOptional()
  @IsString()
  @IsEnum(ServiceProviderStatusEnum)
  status?: ServiceProviderStatusEnum;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  branchId?: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ApiProperty({ type: String })
  brandId: Types.ObjectId;
}
