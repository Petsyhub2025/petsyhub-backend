import { ApiProperty } from '@nestjs/swagger';
import { BlockedReasonEnum, IsDateFromTimestamp, TransformTimeStamp } from '@instapets-backend/common';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class BlockUserDto {
  @IsDateFromTimestamp()
  @TransformTimeStamp()
  @ApiProperty({ type: Number })
  blockDate: Date;

  @IsNotEmpty()
  @IsString()
  @IsEnum(BlockedReasonEnum)
  blockReason: BlockedReasonEnum;
}
