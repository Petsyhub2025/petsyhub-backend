import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetFeedQueryDto {
  @IsOptional()
  @IsNumber()
  limit?: number = 5;

  @IsOptional()
  @IsNumber()
  afterId?: number;
}
