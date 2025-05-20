import { ModelNames } from '@common/constants';
import { faker } from '@faker-js/faker';
import { Injectable, Inject } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { IBaseFactory } from '@testing/interfaces';
import { IUserModel, User } from '@common/schemas/mongoose/user/user.type';
import { MediaTypeEnum } from '@common/schemas/mongoose/common/media';

@Injectable()
export class UserFactory implements IBaseFactory<HydratedDocument<User>> {
  constructor(@Inject(ModelNames.USER) private userModel: IUserModel) {}

  async create() {
    const testUser: Partial<User> = {
      bio: faker.lorem.paragraph(),
      profilePictureMedia: {
        url: `https://media.petsy-dev.space/random/random.png`,
        type: MediaTypeEnum.IMAGE,
        isSensitiveContent: false,
      },
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const user = new this.userModel(testUser);

    await user.save();

    return { mock: testUser, result: user };
  }
}
