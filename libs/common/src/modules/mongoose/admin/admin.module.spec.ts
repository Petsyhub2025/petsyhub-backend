import { ModelNames } from '@common/constants';
import { TestingModule } from '@nestjs/testing';
import { AdminMongooseModule } from './admin.module';
import { AdminFactory, createTestingModule } from '@instapets-backend/testing';
import { IAdminModel } from '@common/schemas/mongoose/admin/admin.type';

describe('AdminModule', () => {
  let module: TestingModule;
  let adminModule: AdminMongooseModule;
  let adminModel: IAdminModel;
  let adminFactory: AdminFactory;

  beforeAll(async () => {
    module = await createTestingModule({
      modules: [AdminMongooseModule],
      services: [AdminFactory],
    });

    adminModule = module.get<AdminMongooseModule>(AdminMongooseModule);
    adminModel = module.get<IAdminModel>(ModelNames.ADMIN);
    adminFactory = module.get<AdminFactory>(AdminFactory);
  });

  it('admin module should be defined', () => {
    expect(adminModule).toBeDefined();
  });

  it('adminModel should be defined', () => {
    expect(adminModel).toBeDefined();
  });

  it('adminFactory should be defined', () => {
    expect(adminFactory).toBeDefined();
  });

  it('adminModel create', async () => {
    const { mock: testAdmin, result: admin } = await adminFactory.create();

    expect(admin).toBeDefined();
    expect(admin.toObject()).toEqual(expect.objectContaining(testAdmin));
  });

  afterAll(async () => {
    await module.close();
  });
});
