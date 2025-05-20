import { StripeMetadataEventsEnum } from '@common/enums';

export interface IBaseStripeMetaData {
  event: StripeMetadataEventsEnum;
}

export interface IStripeSetupIntentMetaData extends IBaseStripeMetaData {
  event: StripeMetadataEventsEnum.SETUP_INTENT_SUCCEEDED;
  setDefault: boolean;
  customerId: string;
}
