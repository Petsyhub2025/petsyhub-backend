import { IsUsernameOrObjectId } from '@common/decorators/class-validator/common';
import { ShareableDeepLinkModelsEnum } from '@common/enums';
import { IsEnum, IsString } from 'class-validator';

export class DynamicLinkLinkToSubSchemaType {
  @IsString()
  @IsEnum(ShareableDeepLinkModelsEnum)
  modelType: ShareableDeepLinkModelsEnum;

  @IsString()
  @IsUsernameOrObjectId()
  modelIdentifier: string;
}
