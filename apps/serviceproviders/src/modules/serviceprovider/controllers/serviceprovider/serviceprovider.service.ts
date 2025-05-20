import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  addPaginationStages,
  AppConfig,
  AwsS3Service,
  CustomError,
  ErrorType,
  IBaseBranchModel,
  IBrandMembershipModel,
  IBrandModel,
  IServiceProviderModel,
  ModelNames,
} from '@instapets-backend/common';
import { Connection, Types } from 'mongoose';
import { UpdateServiceProviderProfileDto } from './dto/update-profile.dto';
import { CreateServiceProviderDto } from './dto/create-serviceprovider.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { GetServiceProvidersDto } from './dto/get-serviceproviders.dto';
import { ServiceProviderIdParamDto } from './dto/serviceprovider-id-param.dto';
import { ServiceProviderResetPasswordDto } from './dto/reset-password.dto';
import { BrandIdQueryDto } from '@serviceproviders/shared/dto/brand-id-query.dto';

@Injectable()
export class ServiceProviderProfileService {
  constructor(
    @Inject(ModelNames.SERVICE_PROVIDER)
    private readonly serviceProviderModel: IServiceProviderModel,
    @Inject(ModelNames.BRAND_MEMBERSHIP)
    private readonly brandMembershipModel: IBrandMembershipModel,
    @Inject(ModelNames.BRAND)
    private readonly brandModel: IBrandModel,
    @Inject(ModelNames.BASE_BRANCH)
    private readonly baseBranchModel: IBaseBranchModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly s3Service: AwsS3Service,
    private readonly appConfig: AppConfig,
  ) {}

  async createStaffMember(
    ownerId: string | Types.ObjectId,
    { email, fullName, phoneNumber, anotherPhoneNumber, brand: brandId }: CreateServiceProviderDto,
  ) {
    const brand = await this.brandModel.findById(brandId);
    if (!brand)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Brand not found',
            ar: 'العلامة المسجلة غير موجودة',
          },
          event: 'BRAND_NOT_FOUND',
        }),
      );

    const staffMember = await this.serviceProviderModel.findOne({ email });
    if (staffMember) {
      if (ownerId.toString() === staffMember._id.toString())
        throw new ConflictException(
          new CustomError({
            localizedMessage: {
              en: 'Your account already has a membership for the brand',
              ar: 'حسابك لديه بالفعل عضوية للعلامة التجارية',
            },
            event: 'HAS_ALREADY_BRAND_MEMBERSHIP',
          }),
        );

      await this.brandMembershipModel.create({
        serviceProvider: staffMember._id,
        brand: new Types.ObjectId(brandId),
      });
      return;
    }

    const session = await this.connection.startSession();
    try {
      session.startTransaction({
        readPreference: 'primary',
      });
      const createdStaffMember = new this.serviceProviderModel();
      createdStaffMember.set({
        email,
        fullName,
        phoneNumber,
        anotherPhoneNumber,
      });
      await createdStaffMember.save({ session });

      const createdBrandMembership = new this.brandMembershipModel();
      createdBrandMembership.set({
        serviceProvider: createdStaffMember._id,
        brand: new Types.ObjectId(brandId),
        isDefault: true,
      });
      await createdBrandMembership.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
  async getAllStaffMembers(
    serviceProviderCreatorId: string | Types.ObjectId,
    { branchId, limit, page, brandId }: GetServiceProvidersDto,
  ) {
    const matchStage = [
      {
        $match: {
          brand: new Types.ObjectId(brandId),
          isBrandOwner: false,
          ...(branchId && { assignedBranches: new Types.ObjectId(branchId) }),
        },
      },
    ];
    // eslint-disable-next-line prefer-const
    let [[{ total = 0 } = {}], docs] = await Promise.all([
      this.brandMembershipModel.aggregate(matchStage).count('total'),
      this.brandMembershipModel.aggregate([
        ...matchStage,
        { $sort: { createdAt: -1 } },
        ...addPaginationStages({ page, limit }),
        {
          $lookup: {
            from: 'serviceproviders',
            let: { serviceProviderId: '$serviceProvider' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$serviceProviderId'],
                  },
                },
              },
              {
                $project: {
                  fullName: 1,
                  email: 1,
                  phoneNumber: 1,
                },
              },
            ],
            as: 'serviceProvider',
          },
        },
        {
          $unwind: {
            path: '$serviceProvider',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $replaceRoot: {
            newRoot: '$serviceProvider',
          },
        },
      ]),
    ]);

    return {
      data: docs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
  async updateServiceProvider() {}
  async getServiceProviderById(
    serviceProviderCreator: string | Types.ObjectId,
    { serviceProviderId }: ServiceProviderIdParamDto,
    { brandId }: BrandIdQueryDto,
  ) {
    const [serviceProvider] = await this.brandMembershipModel.aggregate([
      {
        $match: {
          serviceProvider: new Types.ObjectId(serviceProviderId),
          brand: new Types.ObjectId(brandId),
        },
      },
      {
        $lookup: {
          from: 'branchaccesscontrols',
          let: { brandId: '$brand' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$brand', '$$brandId'] },
                    { $eq: ['$serviceProvider', new Types.ObjectId(serviceProviderId)] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'brands',
                let: { brandId: '$brand' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$brandId'],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                      logoPictureMedia: 1,
                    },
                  },
                ],
                as: 'brand',
              },
            },
            {
              $unwind: {
                path: '$brand',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                branch: 1,
                role: 1,
                brand: 1,
              },
            },
          ],
          as: 'assignedBrands',
        },
      },
      {
        $project: {
          _id: 0,
          serviceProvider: 1,
          assignedBrands: 1,
        },
      },
    ]);

    if (!serviceProvider)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'المستخدم غير موجود',
            en: 'Service provider not found',
          },
          event: 'NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );

    return serviceProvider;
  }
  async suspendServiceProvider() {}
  async unsuspendServiceProvider() {}

  async getSelfServiceProvider(serviceProviderId: string | Types.ObjectId) {
    const savedServiceProvider = await this.serviceProviderModel
      .findOne({ _id: new Types.ObjectId(serviceProviderId) }, { fullName: 1, email: 1, phoneNumber: 1 })
      .lean();

    if (!savedServiceProvider)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'المستخدم غير موجود',
            en: 'Service provider not found',
          },
          event: 'NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );

    return savedServiceProvider;
  }

  async updateSelfServiceProvider(serviceProviderId: string | Types.ObjectId, body: UpdateServiceProviderProfileDto) {
    const savedServiceProvider = await this.serviceProviderModel.findById(serviceProviderId);

    if (!savedServiceProvider)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'مقدم الخدمة غير موجود',
            en: 'Service provider not found',
          },
          event: 'NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );

    savedServiceProvider.set({ ...body });
    await savedServiceProvider.save();
  }

  async resetPassword(
    serviceProviderId: string | Types.ObjectId,
    { currentPassword, newPassword }: ServiceProviderResetPasswordDto,
  ) {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'New password must be different from the current password',
            ar: 'يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية',
          },
          event: 'RESET_PASSWORD_INVALID',
          errorType: ErrorType.CONFLICT,
        }),
      );
    }
    const serviceProvider = await this.serviceProviderModel.findById(serviceProviderId, {
      password: 1,
    });

    if (!serviceProvider) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            ar: 'مقدم الخدمة غير موجود',
            en: 'Service provider not found',
          },
          event: 'NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }
    const isCurrentPasswordMatches = await serviceProvider.comparePassword(currentPassword);
    if (!isCurrentPasswordMatches) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect Email or password',
            ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    serviceProvider.set({
      password: newPassword,
    });

    await serviceProvider.save();
  }

  private async populateServiceProviderBranches(serviceProviders: any[]) {
    const serviceProviderAssignedBranches = serviceProviders.flatMap(
      (serviceProvider) => serviceProvider.assignedBranches,
    );

    const assignedBranchesIds = [...new Set(serviceProviderAssignedBranches.map((_id) => _id.toString()))];

    const branches = await this.baseBranchModel
      .find(
        {
          _id: {
            $in: assignedBranchesIds.map((assignedBranch) => new Types.ObjectId(assignedBranch)),
          },
        },
        { _id: 1, name: 1 },
      )
      .lean();

    for (const serviceProvider of serviceProviders) {
      serviceProvider.assignedBranches = serviceProvider.assignedBranches.map((assignedBranch) =>
        assignedBranch.toString(),
      );
      serviceProvider.assignedBranches = branches.filter((branch) =>
        serviceProvider.assignedBranches.includes(branch._id.toString()),
      );
    }

    return serviceProviders;
  }
  private formateStaffMembersDropList(docs: any[]) {
    return docs.map((doc) => {
      return doc.serviceProvider;
    });
  }
}
