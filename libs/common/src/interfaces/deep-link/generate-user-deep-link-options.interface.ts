import { UserDeepLinkModelInteractionsEnum, DeepLinkModelsEnum, ShareableDeepLinkModelsEnum } from '@common/enums';

interface IUserDeepLinkModelInteraction {
  interaction: UserDeepLinkModelInteractionsEnum;
  interactionId: string;
}

export interface IUserDeepLinkOptions {
  modelName: DeepLinkModelsEnum | ShareableDeepLinkModelsEnum;
  modelId: string;
  modelInteractions?: IUserDeepLinkModelInteraction[];
  queryParams?: Record<string, string | string[]>;
}
