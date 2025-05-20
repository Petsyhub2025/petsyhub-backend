import { PickType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { ServiceProvider } from '@common/schemas/mongoose/serviceprovider/serviceprovider.type';
import { IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';

export class PendingServiceProvider extends PickType(ServiceProvider, [
  'email',
  'password',
  'fullName',
  'phoneNumber',
] as const) {
  constructor(pendingServiceProvider: PendingServiceProvider) {
    super(pendingServiceProvider);
    Object.assign(this, pendingServiceProvider);
  }
}

export interface IPendingServiceProviderInstanceMethods extends IBaseInstanceMethods {}
export interface IPendingServiceProviderModel
  extends Model<PendingServiceProvider, Record<string, unknown>, IPendingServiceProviderInstanceMethods> {}
