import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  addPaginationStages,
  AppConfig,
  AwsS3Service,
  BranchAccessPermissions,
  BranchEventsEnum,
  CustomError,
  ErrorType,
  IBaseBranchModel,
  IBranchAccessControlModel,
  IBranchAccessRoleModel,
  IBranchServiceTypeModel,
  IBrandMembershipModel,
  IBrandModel,
  IServiceProviderModel,
  Media,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
  ServiceProviderEventsEnum,
  ServiceProviderStatusEnum,
  ShippingTypeEnum,
} from '@instapets-backend/common';
import { ClientSession, Connection, PipelineStage, Types } from 'mongoose';
import { AssignedBranchMemberDto, CreateBranchDto } from './dto/create-branch.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { errorManager } from '@branches/serviceprovider/shared/config/errors.config';
import { BranchIdParamDto } from '@branches/shared/dto/branch-id-param.dto';
import { BranchAccessRoleLevelEnum } from '@common/schemas/mongoose/branch-access-control/branch-access-role/branch-access-role.enum';
import { GetBranchesQueryDto } from './dto/get-branches.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BranchesService {
  private ownerDefaultPermissions: BranchAccessPermissions = {
    branches: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    appointments: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    staffMembers: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    productCategories: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    products: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    inventory: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    orders: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    customers: {
      read: true,
    },
  };
  constructor(
    @Inject(ModelNames.BRANCH_SERVICE_TYPE)
    private readonly branchServiceTypeModel: IBranchServiceTypeModel,
    @Inject(ModelNames.BASE_BRANCH)
    private readonly baseBranchModel: IBaseBranchModel,
    @Inject(ModelNames.BRAND_MEMBERSHIP)
    private brandMembershipModel: IBrandMembershipModel,
    @Inject(ModelNames.BRANCH_ACCESS_CONTROL)
    private branchAccessControlModel: IBranchAccessControlModel,
    @Inject(ModelNames.BRANCH_ACCESS_ROLE)
    private branchAccessRoleModel: IBranchAccessRoleModel,
    @Inject(ModelNames.BRAND)
    private brandModel: IBrandModel,
    @Inject(ModelNames.SERVICE_PROVIDER)
    private readonly serviceProviderModel: IServiceProviderModel,
    @InjectConnection() private connection: Connection,
    private readonly mediaUploadService: MediaUploadService,
    private readonly s3Service: AwsS3Service,
    private appConfig: AppConfig,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllBranches(serviceProviderId: string | Types.ObjectId, getBranchesQueryDto: GetBranchesQueryDto) {
    const { page, limit, brandId } = getBranchesQueryDto;

    const matchStage: PipelineStage[] = [
      {
        $match: {
          brand: new Types.ObjectId(brandId),
        },
      },
    ];
    let isPaginated = false;
    if (page && limit) {
      isPaginated = true;
    }

    const [[{ total = 0 } = {}], branches] = await Promise.all([
      this.baseBranchModel.aggregate(matchStage).count('total'),
      this.baseBranchModel.aggregate([
        ...matchStage,
        { $sort: { createdAt: -1 } },
        ...(isPaginated ? addPaginationStages({ limit, page }) : []),
        {
          $project: {
            name: 1,
            branchType: 1,
            status: 1,
          },
        },
      ]),
    ]);

    if (page && limit) {
      return { data: branches, total, limit, page, pages: Math.ceil(total / limit) };
    }

    return { data: branches, total };
  }

  async createBranch(serviceProviderId: string | Types.ObjectId, body: CreateBranchDto) {
    const {
      brand: brandId,
      assignedBranchMemberDto,
      documents,
      estimatedArrivalTime,
      isSelfShipping,
      shippingFee,
      estimatedArrivalUnit,
      shippingType,
      ...restOfBody
    } = body;

    const brand = await this.brandModel.findById(brandId);
    if (!brand) throw new NotFoundException(errorManager.BRAND_NOT_FOUND);

    if (assignedBranchMemberDto?.length > 0) {
      const duplicates = [];
      const serviceProviderIds = new Map();
      assignedBranchMemberDto.forEach((assignBranchMember) => {
        const serviceProviderId = assignBranchMember.serviceProvider.toString();
        if (serviceProviderIds.has(serviceProviderId)) {
          // If item id already exists in the map, it's a duplicate
          duplicates.push(serviceProviderId);
        } else {
          // Otherwise, add it to the map
          serviceProviderIds.set(serviceProviderId, assignBranchMember);
        }
      });
      if (duplicates.length > 0) throw new ConflictException(errorManager.DUPLICATES_MEMBER_ASSIGNMENT);

      const rolesIds = assignedBranchMemberDto.map((member) => new Types.ObjectId(member.role));
      if (
        !(await this.branchAccessRoleModel.findOne({
          _id: { $in: rolesIds },
          level: BranchAccessRoleLevelEnum.MANAGER,
        }))
      ) {
        throw new NotFoundException(errorManager.MANAGER_ROLE_REQUIRED);
      }
    }

    if (await this.baseBranchModel.exists({ brand: new Types.ObjectId(brandId), name: restOfBody.name })) {
      throw new ConflictException(errorManager.BRANCH_NAME_ALREADY_EXISTS);
    }

    const session = await this.connection.startSession();
    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const uploadedDocuments: Media[] = [];
      if (documents?.length > 0) {
        for (const document of documents) {
          await this.s3Service.copyObjectToMediaBucket(
            document.s3Key,
            `${serviceProviderId}/branches/${document.s3Key}`,
          );

          uploadedDocuments.push({
            type: MediaTypeEnum.PDF,
            url: `${this.appConfig.MEDIA_DOMAIN}/${serviceProviderId}/branches/${document.s3Key}`,
          });
        }
      }

      // Create Branch
      const createdBranch = new this.baseBranchModel();
      createdBranch.set({
        email: restOfBody.email,
        country: new Types.ObjectId(restOfBody.country),
        city: new Types.ObjectId(restOfBody.city),
        area: new Types.ObjectId(restOfBody.area),
        brand: new Types.ObjectId(brandId),
        name: restOfBody.name,
        branchType: restOfBody.branchType,
        phoneNumber: restOfBody.phoneNumber,
        location: {
          type: 'Point',
          coordinates: [restOfBody.location.lng, restOfBody.location.lat],
        },
        streetAddress: restOfBody.streetAddress,
        postalCode: restOfBody.postalCode,
        schedule: restOfBody.schedule,
        ...(documents?.length > 0 && { documents: uploadedDocuments }),
        ...(restOfBody.additionalPhoneNumber && { additionalPhoneNumber: restOfBody.additionalPhoneNumber }),
        ...(restOfBody.petTypes?.length > 0 && {
          petTypes: restOfBody.petTypes.map((petType) => new Types.ObjectId(petType)),
        }),
        ...(restOfBody.serviceTypes?.length > 0 && {
          serviceTypes: restOfBody.serviceTypes.map((serviceType) => new Types.ObjectId(serviceType)),
        }),
        ...(restOfBody.medicalSpecialties?.length > 0 && {
          medicalSpecialties: restOfBody.medicalSpecialties.map(
            (medicalSpecialty) => new Types.ObjectId(medicalSpecialty),
          ),
        }),
        ...(estimatedArrivalTime && { estimatedArrivalTime }),
        ...(isSelfShipping && { isSelfShipping }),
        ...(shippingFee && { shippingFee }),
        // ...(shippingType && { shippingType }),
        shippingType: isSelfShipping ? ShippingTypeEnum.PAID : undefined,
        ...(estimatedArrivalUnit && { estimatedArrivalUnit }),
      });

      // const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
      //   files: documents,
      //   filesS3PathPrefix: `${serviceProviderId}/branches`,
      //   resourceModel: {
      //     name: UploadModelResources.BRANCHES,
      //   },
      //   allowedMediaTypes: [MediaTypeEnum.IMAGE],
      // });

      // createdBranch.set({
      //   documents: media,
      //   mediaProcessingId,
      // });

      await createdBranch.save({ session });

      if (assignedBranchMemberDto?.length > 0) {
        await this.createServiceProvidersBranchAccessControl(
          assignedBranchMemberDto,
          brandId,
          createdBranch._id,
          session,
        );
      }

      const hasCreatorDefaultBranch = await this.branchAccessControlModel
        .exists({
          serviceProvider: new Types.ObjectId(serviceProviderId),
          isDefault: true,
          brand: new Types.ObjectId(brandId),
        })
        .session(session);

      const ownerRole = await this.branchAccessRoleModel
        .findOne({ level: BranchAccessRoleLevelEnum.OWNER }, { name: 1, level: 1 })
        .lean()
        .session(session);

      const createdOwnerBranchAccessControl = new this.branchAccessControlModel({
        serviceProvider: new Types.ObjectId(serviceProviderId),
        brand: new Types.ObjectId(brandId),
        branch: createdBranch._id,
        permissions: this.ownerDefaultPermissions,
        role: { _id: ownerRole._id, level: ownerRole.level, name: ownerRole.name },
        ...(hasCreatorDefaultBranch ? { isDefault: false } : { isDefault: true }),
      });
      await createdOwnerBranchAccessControl.save({ session });

      // Set default branch access for member
      const serviceProviderBrandMembership = await this.brandMembershipModel
        .findOne({
          serviceProvider: new Types.ObjectId(serviceProviderId),
          brand: new Types.ObjectId(brandId),
        })
        .session(session);

      serviceProviderBrandMembership.assignedBranches.push(new Types.ObjectId(createdBranch._id));
      serviceProviderBrandMembership.defaultBranchAccessControl = {
        branch: new Types.ObjectId(createdBranch._id),
        permissions: this.ownerDefaultPermissions,
        role: { _id: ownerRole._id, level: ownerRole.level, name: ownerRole.name },
        status: ServiceProviderStatusEnum.ACTIVE,
      };

      await serviceProviderBrandMembership.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        new CustomError({
          localizedMessage: {
            en: 'An internal server error occurred. Please try again. The data you entered may be invalid',
            ar: 'حدث خطأ داخلي في الخادم. يرجى المحاولة مرة أخرى. قد تكون البيانات التي أدخلتها غير صحيحة',
          },
          error: ErrorType.BACKEND_CODE,
          event: 'BRANCH_CREATION_TRANSACTION_ERROR',
        }),
      );
    } finally {
      session.endSession();
    }

    const serviceProvider = await this.serviceProviderModel.findById(serviceProviderId);
    const branchAccessControl = await this.branchAccessControlModel
      .findOne({ serviceProvider: serviceProviderId })
      .sort({ createdAt: -1 });

    const newBranch = await this.baseBranchModel.findById(branchAccessControl.branch);

    this.eventEmitter.emit(ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_CREATED, {
      serviceProvider,
      branch: newBranch,
    });
  }

  private async createServiceProvidersBranchAccessControl(
    assignedBranchMemberDto: AssignedBranchMemberDto[],
    brandId: string | Types.ObjectId,
    branchId: string | Types.ObjectId,
    session: ClientSession,
  ) {
    // Create Branch Access Control for members and owner
    for (const assignedMember of assignedBranchMemberDto) {
      const assignedRole = await this.branchAccessRoleModel
        .findById(assignedMember.role.toString(), {
          _id: 1,
          name: 1,
          level: 1,
        })
        .lean()
        .session(session);
      if (!assignedRole) throw new NotFoundException(errorManager.ROLE_NOT_FOUND);

      const serviceProviderBrandMembership = await this.brandMembershipModel
        .findOne(
          {
            serviceProvider: new Types.ObjectId(assignedMember.serviceProvider),
            brand: new Types.ObjectId(brandId),
          },
          { serviceProvider: 1 },
        )
        .session(session);
      if (!serviceProviderBrandMembership) throw new NotFoundException(errorManager.MEMBER_BRAND_MEMBERSHIP_NOT_FOUND);

      const hasServiceProviderDefaultBranchAccessControl = await this.branchAccessControlModel
        .exists({
          serviceProvider: new Types.ObjectId(assignedMember.serviceProvider),
          isDefault: true,
          brand: new Types.ObjectId(brandId),
        })
        .session(session);

      const uploadedMemberDocuments: Media[] = [];
      for (const document of assignedMember.documents) {
        await this.s3Service.copyObjectToMediaBucket(
          document.s3Key,
          `${assignedMember.serviceProvider}/documents/${document.s3Key}`,
        );

        uploadedMemberDocuments.push({
          type: MediaTypeEnum.PDF,
          url: `${this.appConfig.MEDIA_DOMAIN}/${assignedMember.serviceProvider}/documents/${document.s3Key}`,
        });
      }

      const createdMemberBranchAccessControl = new this.branchAccessControlModel();
      createdMemberBranchAccessControl.set({
        serviceProvider: new Types.ObjectId(assignedMember.serviceProvider),
        brand: new Types.ObjectId(brandId),
        branch: new Types.ObjectId(branchId),
        permissions: assignedMember.permissions,
        role: { _id: assignedRole._id, name: assignedRole.name, level: assignedRole.level },
        medicalSpecialties: assignedMember.medicalSpecialties.map(
          (medicalSpecialty) => new Types.ObjectId(medicalSpecialty),
        ),
        ...(assignedMember.documents?.length && { documents: uploadedMemberDocuments }),
        ...(hasServiceProviderDefaultBranchAccessControl ? { isDefault: false } : { isDefault: true }),
      });
      await createdMemberBranchAccessControl.save({ session });

      // const { media, mediaProcessingId } = await this.mediaUploadService.handleMediaUploads({
      //   files: assignedMember.documents,
      //   filesS3PathPrefix: `${assignedMember.serviceProvider.toString()}/documents/`,
      //   resourceModel: {
      //     name: UploadModelResources.STAFF_MEMBERS_DOCUMENTS,
      //   },
      //   allowedMediaTypes: [MediaTypeEnum.IMAGE],
      // });

      // createdMemberBranchAccessControl.set({
      //   documents: media,
      //   mediaProcessingId,
      // });

      // Set default branch access for member
      const staffBrandMembership = await this.brandMembershipModel
        .findOne({
          serviceProvider: new Types.ObjectId(assignedMember.serviceProvider),
          brand: new Types.ObjectId(brandId),
        })
        .session(session);

      staffBrandMembership.assignedBranches.push(new Types.ObjectId(branchId));
      staffBrandMembership.defaultBranchAccessControl = {
        branch: new Types.ObjectId(branchId),
        permissions: this.ownerDefaultPermissions,
        role: { _id: assignedRole._id, name: assignedRole.name, level: assignedRole.level },
        status: ServiceProviderStatusEnum.ACTIVE,
      };

      await staffBrandMembership.save({ session });
    }
  }

  async getBranchDetails(serviceProviderId: string | Types.ObjectId, { branchId }: BranchIdParamDto) {
    const [branch] = await this.baseBranchModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(branchId) },
      },
      {
        $lookup: {
          from: 'branchaccesscontrols',
          let: { branchId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$branch', '$$branchId'],
                },
              },
            },
            {
              $lookup: {
                from: 'serviceproviders',
                let: {
                  serviceProviderId: '$serviceProvider',
                },
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
                    },
                  },
                ],
                as: 'serviceProvider',
              },
            },
            {
              $unwind: {
                path: '$serviceProvider',
              },
            },
            {
              $lookup: {
                from: 'medicalspecialties',
                let: {
                  medicalSpecialties: '$medicalSpecialties',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $in: ['$_id', '$$medicalSpecialties'],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'medicalSpecialties',
              },
            },
            {
              $project: {
                _id: '$serviceProvider._id',
                fullName: '$serviceProvider.fullName',
                role: 1,
                medicalSpecialties: 1,
              },
            },
          ],
          as: 'staffMembers',
        },
      },
      {
        $lookup: {
          from: 'countries',
          let: {
            countryId: '$country',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$_id',
                    {
                      $ifNull: ['$$countryId', null],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'country',
        },
      },
      {
        $unwind: {
          path: '$country',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'cities',
          let: {
            cityId: '$city',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$cityId', null] }],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'city',
        },
      },
      {
        $unwind: {
          path: '$city',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'areas',
          let: {
            areaId: '$area',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $ifNull: ['$$areaId', null] }],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'area',
        },
      },
      {
        $unwind: {
          path: '$area',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$serviceTypes',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'branchservicetypes',
          let: { serviceTypeId: '$serviceTypes' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$serviceTypeId'],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'serviceTypes',
        },
      },
      {
        $unwind: {
          path: '$serviceTypes',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          root: {
            $first: '$$ROOT',
          },
          serviceTypes: {
            $push: '$serviceTypes',
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$root',
              {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $size: '$serviceTypes',
                      },
                      0,
                    ],
                  }, // Check if array is non-empty
                  then: {
                    serviceTypes: '$serviceTypes',
                  },
                  else: {}, // Don't add the field if empty
                },
              },
            ],
          },
        },
      },
      {
        $unwind: {
          path: '$medicalSpecialties',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'medicalspecialties',
          let: {
            medicalSpecialtyId: '$medicalSpecialties',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$medicalSpecialtyId'],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'medicalSpecialties',
        },
      },
      {
        $unwind: {
          path: '$medicalSpecialties',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          root: {
            $first: '$$ROOT',
          },
          medicalSpecialties: {
            $push: '$medicalSpecialties',
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$root',
              {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $size: '$medicalSpecialties',
                      },
                      0,
                    ],
                  },
                  then: {
                    medicalSpecialties: '$medicalSpecialties',
                  },
                  else: {},
                },
              },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          branchType: 1,
          streetAddress: 1,
          location: 1,
          area: 1,
          city: 1,
          country: 1,
          status: 1,
          phoneNumber: 1,
          additionalPhoneNumber: 1,
          serviceTypes: 1,
          medicalSpecialties: 1,
          staffMembers: 1,
          isSelfShipping: 1,
          shippingFee: 1,
          estimatedArrivalTime: 1,
        },
      },
    ]);
    if (!branch) {
      throw new NotFoundException(errorManager.BRANCH_NOT_FOUND);
    }

    return branch;
  }
}
