import { ModelNames } from '@common/constants';

export interface ISyncEvent {
  command: 'migrate' | 'sync';
  model: ModelNames;
  _id: string;
}
