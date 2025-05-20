import { CustomError, ErrorType, ICustomerModel, ModelNames } from '@instapets-backend/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EditProfileDto } from './dto/edit-profile.dto';

@Injectable()
export class CustomerProfileService {
  constructor(@Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel) {}

  //TODO: Propagate edit profile for social account
  async editProfile(customerId: string | Types.ObjectId, body: EditProfileDto) {
    const oldCustomer = await this.customerModel.findById(customerId);

    if (!oldCustomer) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Customer not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'CUSTOMER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    oldCustomer.set({
      ...body,
    });

    await oldCustomer.save();
  }

  async getCustomerProfile(customerId: string | Types.ObjectId) {
    const [customer] = await this.customerModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(customerId),
        },
      },
      {
        $addFields: {
          username: {
            $concat: ['$firstName', ' ', '$lastName'],
          },
        },
      },
      {
        $project: {
          email: 1,
          username: 1,
          phoneNumber: 1,
        },
      },
    ]);
    if (!customer) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Customer not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'CUSTOMER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    return customer;
  }

  //TODO: Propagate delete all related data
  async deleteProfile(customerId: string) {
    const customer = await this.customerModel.findById(customerId);

    if (!customer) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Customer not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'CUSTOMER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    await customer.deleteDoc();
  }
}
