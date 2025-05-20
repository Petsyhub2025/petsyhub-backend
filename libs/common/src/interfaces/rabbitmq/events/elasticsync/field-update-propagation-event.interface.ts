import { ModelNames } from '@common/constants';

export interface IElasticSyncFieldUpdatePropagationEvent {
  model: ModelNames;
  _id: string;
}
