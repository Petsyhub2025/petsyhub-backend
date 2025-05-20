import { BaseSearchPaginationQuery, ShareableDeepLinkModelsEnum, TransformArray } from '@instapets-backend/common';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetDynamicLinksQueryDto extends BaseSearchPaginationQuery {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsEnum(ShareableDeepLinkModelsEnum, { each: true })
  @TransformArray()
  type?: ShareableDeepLinkModelsEnum[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => obj[key] === 'true')
  isArchived?: boolean;
}
