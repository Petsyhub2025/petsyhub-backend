import { PickType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Customer } from '@common/schemas/mongoose/customer/customer.type';

export class PendingCustomer extends PickType(Customer, [
  'email',
  'password',
  'phoneNumber',
  'firstName',
  'lastName',
] as const) {
  constructor(pendingCustomer: PendingCustomer) {
    super(pendingCustomer);
    Object.assign(this, pendingCustomer);
  }
}

export interface IPendingCustomerInstanceMethods extends IBaseInstanceMethods {}
export interface IPendingCustomerModel
  extends Model<PendingCustomer, Record<string, unknown>, IPendingCustomerInstanceMethods> {}
