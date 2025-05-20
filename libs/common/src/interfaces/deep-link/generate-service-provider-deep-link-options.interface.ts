import { DeepLinkModelsEnum } from '@common/enums';

export interface IServiceProviderDeepLinkOptions {
  modelName: DeepLinkModelsEnum;
  modelId: string;
  queryParams?: Record<string, string | string[]>;
}
