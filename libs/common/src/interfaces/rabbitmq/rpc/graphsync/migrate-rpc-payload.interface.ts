import { ModelNames } from '@common/constants';

export interface IGraphSyncMigrateRpcPayload {
  model: ModelNames;
  _id: string;
}
