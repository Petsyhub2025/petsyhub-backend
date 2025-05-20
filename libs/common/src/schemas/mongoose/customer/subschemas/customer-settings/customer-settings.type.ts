import { IsEnum, IsString } from 'class-validator';
import { CustomerSettingsLanguageEnum } from './customer-settings.enum';

export class CustomerSettingsSubSchemaType {
  @IsString()
  @IsEnum(CustomerSettingsLanguageEnum)
  language: CustomerSettingsLanguageEnum;

  /* No validation fields (hooks) */
  _previousLanguage?: CustomerSettingsLanguageEnum;
}
