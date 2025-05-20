import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cancellationReason?: string;
}
