import { faker } from '@faker-js/faker';
import { Injectable, Inject } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';
import { ModelNames } from '@common/constants';
import { IAdminModel, Admin } from '@common/schemas/mongoose/admin/admin.type';
import { IBaseFactory } from '@testing/interfaces';

@Injectable()
export class AdminFactory implements IBaseFactory<HydratedDocument<Admin>> {
  constructor(@Inject(ModelNames.ADMIN) private adminModel: IAdminModel) {}

  async create() {
    const testAdmin: Partial<Admin> = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      permissions: {
        admins: {
          create: false,
          read: false,
          update: false,
          delete: false,
        },
        adminRoles: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        appVersions: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        users: {
          read: false,
          update: false,
          filter: false,
        },
        pets: {
          read: false,
          update: false,
          filter: false,
        },
        posts: {
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        comments: {
          read: false,
          update: false,
          delete: false,
        },
        petBreeds: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        petTypes: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        moderationReports: {
          read: false,
          update: false,
          delete: false,
        },
        cities: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        countries: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        areas: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        sync: {
          read: false,
          update: false,
        },
        branchServiceTypes: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        serviceProviders: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        appointments: {
          read: false,
        },
        eventCategories: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        eventFacilities: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        marketing: {
          read: false,
          update: false,
          create: false,
          delete: false,
          filter: false,
        },
        lostFoundPosts: {
          read: false,
          filter: false,
          update: false,
          delete: false,
        },
        topics: {
          read: false,
          update: false,
          create: false,
          delete: false,
          filter: false,
        },
        brands: {
          read: false,
          update: false,
          create: false,
          delete: false,
          filter: false,
        },
        branches: {
          read: false,
          update: false,
          create: false,
          delete: false,
          filter: false,
        },
        branchAccessRole: {
          read: false,
          update: false,
          create: false,
          delete: false,
          filter: false,
        },
        medicalSpecialty: {
          read: false,
          update: false,
          create: false,
          delete: false,
          filter: false,
        },
        products: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
        productCategories: {
          create: false,
          read: false,
          update: false,
          delete: false,
          filter: false,
        },
      },
      role: {
        _id: new Types.ObjectId(),
        name: faker.person.jobTitle(),
      },
    };

    const admin = new this.adminModel(testAdmin);

    await admin.save();

    return { mock: testAdmin, result: admin };
  }
}
