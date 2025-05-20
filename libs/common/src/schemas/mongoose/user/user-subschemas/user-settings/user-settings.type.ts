import { IsEnum, IsString } from 'class-validator';
import { UserSettingsLanguageEnum } from './user-settings.enum';

export class UserSettingsSubSchemaType {
  @IsString()
  @IsEnum(UserSettingsLanguageEnum)
  language: UserSettingsLanguageEnum;

  /* No validation fields (hooks) */
  _previousLanguage?: UserSettingsLanguageEnum;
}
