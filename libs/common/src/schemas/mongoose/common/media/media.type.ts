import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { MediaOrientationEnum, MediaTypeEnum } from './media.enum';

export class Media {
  @IsString()
  @IsEnum(MediaTypeEnum)
  type: MediaTypeEnum;

  @IsString()
  @IsUrl()
  // @Matches(/^(https:\/\/media\.petsy(-dev|-tst)?\.(space|world))/)
  url: string;

  @IsOptional()
  @IsBoolean()
  isSensitiveContent?: boolean;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  @IsEnum(MediaOrientationEnum)
  orientation?: MediaOrientationEnum;

  @ValidateIf((o) => o.type === MediaTypeEnum.VIDEO)
  @IsString()
  @IsUrl()
  // @Matches(/^(https:\/\/media\.petsy(-dev|-tst)?\.(space|world))/)
  playbackUrl?: string;
}
