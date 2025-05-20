import { ModelNames } from '@common/constants';
import { IUserModel } from '@common/schemas/mongoose/user/user.type';
import { UserFactory, createTestingModule } from '@instapets-backend/testing';
import { TestingModule } from '@nestjs/testing';
import { UserMongooseModule } from './user.module';

describe('UserModule', () => {
  let module: TestingModule;
  let userModule: UserMongooseModule;
  let userModel: IUserModel;
  let userFactory: UserFactory;

  beforeAll(async () => {
    module = await createTestingModule({
      modules: [UserMongooseModule],
      services: [UserFactory],
    });

    userModule = module.get<UserMongooseModule>(UserMongooseModule);
    userModel = module.get<IUserModel>(ModelNames.USER);
    userFactory = module.get<UserFactory>(UserFactory);
  });

  it('user module should be defined', () => {
    expect(userModule).toBeDefined();
  });

  it('userModel should be defined', () => {
    expect(userModel).toBeDefined();
  });

  it('userFactory should be defined', () => {
    expect(userFactory).toBeDefined();
  });

  it('userModel create', async () => {
    const { mock: testUser, result: user } = await userFactory.create();

    expect(await user.comparePassword(testUser.password)).toBe(true);

    delete testUser.password;

    expect(user).toBeDefined();
    expect(user.toObject()).toEqual(expect.objectContaining(testUser));
  });

  afterAll(async () => {
    await module.close();
  });
});
