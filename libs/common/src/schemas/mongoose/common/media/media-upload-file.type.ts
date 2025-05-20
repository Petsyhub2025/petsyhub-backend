import { PickType } from '@nestjs/swagger';
import { Media } from './media.type';
import { IsOptional, IsString, Matches } from 'class-validator';
export class MediaUploadFile extends PickType(Media, ['type'] as const) {
  @IsOptional()
  @IsString()
  @Matches(/^private\/[a-z0-9-]+:[a-z0-9-]+\/[^\s\/]+\.[a-zA-Z][a-zA-Z0-9]*$/, { message: 'Invalid S3 key format' })
  s3Key?: string;

  @IsOptional()
  @IsString()
  // @Matches(/^(https:\/\/media\.petsy(-dev|-tst)?\.(space|world))/)
  url?: string;
}

export class MediaUploadFilePreSignedUrl extends PickType(Media, ['type'] as const) {
  @IsOptional()
  @IsString()
  // @Matches(/^(https:\/\/media\.petsy(-dev|-tst)?\.(space|world))/)
  url?: string;
}
