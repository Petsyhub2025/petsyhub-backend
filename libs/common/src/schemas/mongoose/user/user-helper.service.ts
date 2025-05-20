import { Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import type { UserAddress } from './user-address';
import type { User } from './user.type';

@Injectable()
export class UserHelperService {
  async getActiveAddress(this: HydratedDocument<User>) {
    if (!this.activeAddress) return null;

    const user = await this.populate<{ activeAddress: HydratedDocument<UserAddress> }>([
      {
        path: 'activeAddress',
        populate: [
          {
            path: 'city',
            select: 'name',
          },
          {
            path: 'country',
            select: 'name',
          },
        ],
        select: {
          _id: 1,
          city: 1,
          country: 1,
        },
      },
    ]);

    return user.activeAddress;
  }
}
