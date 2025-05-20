import { UserFcmTopicsEnum } from '@common/enums';
import { UserSettingsLanguageEnum } from '@common/schemas/mongoose/user/user-subschemas/user-settings';

export const languageToTopicMap = {
  [UserSettingsLanguageEnum.EN]: [UserFcmTopicsEnum.MARKETING_EN],
  [UserSettingsLanguageEnum.AR]: [UserFcmTopicsEnum.MARKETING_AR],
};

export function userLanguageToFcmTopicsMapper(language: UserSettingsLanguageEnum) {
  return languageToTopicMap[language];
}
