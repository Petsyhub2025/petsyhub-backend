import { AdminDeepLinkSubModelsEnum, DeepLinkModelsEnum } from '@common/enums';

// NOTE: Submodels arent used yet. They are here for future use.
interface IAdminDeepLinkSubModel {
  subModelName: AdminDeepLinkSubModelsEnum;
  subModelId: string;
}

export interface IAdminDeepLinkOptions {
  modelName: DeepLinkModelsEnum;
  modelId: string;
  subModels?: IAdminDeepLinkSubModel[];
  queryParams?: Record<string, string | string[]>;
}
