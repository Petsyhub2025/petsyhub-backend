import { IsNumber } from 'class-validator';

export class GetDynamicLinkAnalyticsQueryDto {
  @IsNumber()
  days: number;
}
