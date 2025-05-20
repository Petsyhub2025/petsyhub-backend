import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AppConfig,
  AwsS3Service,
  BasePaginationQuery,
  CustomError,
  CustomLoggerService,
  ErrorType,
  IBrandMembershipModel,
  IBrandModel,
  IServiceProviderModel,
  Media,
  MediaTypeEnum,
  MediaUploadService,
  ModelNames,
} from '@instapets-backend/common';
import { Connection, Types } from 'mongoose';
import { CreateBrandDto } from './dto/create-brand.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { BrandIdParamDto } from '@brands/shared/dto/brand-id-param.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { errorManager } from '@brands/serviceprovider/shared/config/errors.config';
import { UploadModelResources } from '@serverless/common/enums/upload-model-resources.enum';
import { BrandTypeEnum } from '@common/schemas/mongoose/brand/brand.enum';

@Injectable()
export class BrandService {
  constructor(
    @Inject(ModelNames.BRAND)
    private brandModel: IBrandModel,
    @Inject(ModelNames.BRAND_MEMBERSHIP)
    private brandMembershipModel: IBrandMembershipModel,
    @Inject(ModelNames.SERVICE_PROVIDER)
    private serviceProviderModel: IServiceProviderModel,
    private readonly mediaUploadService: MediaUploadService,
    @InjectConnection() private readonly connection: Connection,
    private readonly s3Service: AwsS3Service,
    private appConfig: AppConfig,
    private readonly logger: CustomLoggerService,
  ) {}

  async createBrand(serviceProviderId: string | Types.ObjectId, body: CreateBrandDto) {
    const { coverPictureMedia, logoPictureMedia, email, name, phoneNumber, anotherPhoneNumber, bio, hotline } = body;
    const brandCreator = await this.serviceProviderModel.findById(serviceProviderId);
    if (!brandCreator) throw new NotFoundException(errorManager.SERVICE_PROVIDER_NOT_FOUND);

    const session = await this.connection.startSession();
    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const hasDefaultBrand = await this.brandMembershipModel
        .exists({
          serviceProvider: new Types.ObjectId(serviceProviderId),
          isDefault: true,
        })
        .session(session);

      // const {
      //   media: coverPictureMediaUploaded,
      //   mediaProcessingId: coverPictureMediaProcessingId,
      // }: { media: Media[]; mediaProcessingId: string } = await this.mediaUploadService.handleMediaUploads({
      //   files: [coverPictureMedia],
      //   filesS3PathPrefix: `${serviceProviderId}/brands/cover`,
      //   resourceModel: {
      //     name: UploadModelResources.BRANDS,
      //   },
      //   allowedMediaTypes: [MediaTypeEnum.IMAGE],
      // });

      // const {
      //   media: logoPictureMediaUploaded,
      //   mediaProcessingId: logoPictureMediaProcessingId,
      // }: { media: Media[]; mediaProcessingId: string } = await this.mediaUploadService.handleMediaUploads({
      //   files: [logoPictureMedia],
      //   filesS3PathPrefix: `${serviceProviderId}/brands/logo`,
      //   resourceModel: {
      //     name: UploadModelResources.BRANDS,
      //   },
      //   allowedMediaTypes: [MediaTypeEnum.IMAGE],
      // });

      await Promise.all([
        this.s3Service.copyObjectToMediaBucket(
          logoPictureMedia.s3Key,
          `${serviceProviderId}/brands/logo/${logoPictureMedia.s3Key}`,
        ),
        this.s3Service.copyObjectToMediaBucket(
          coverPictureMedia.s3Key,
          `${serviceProviderId}/brands/cover/${coverPictureMedia.s3Key}`,
        ),
      ]);

      //TODO: Handling BrandType 'SUPPLIER'
      const createdBrand = new this.brandModel();
      createdBrand.set({
        email,
        name,
        phoneNumber,
        anotherPhoneNumber,
        bio,
        hotline,
        logoPictureMedia: {
          type: MediaTypeEnum.IMAGE,
          url: `${this.appConfig.MEDIA_DOMAIN}/${serviceProviderId}/brands/logo/${logoPictureMedia.s3Key}`,
        },
        coverPictureMedia: {
          type: MediaTypeEnum.IMAGE,
          url: `${this.appConfig.MEDIA_DOMAIN}/${serviceProviderId}/brands/cover/${coverPictureMedia.s3Key}`,
        },
        brandType: BrandTypeEnum.SERVICE_PROVIDER,
      });
      await createdBrand.save({ session });

      const createdBrandMembership = new this.brandMembershipModel();
      createdBrandMembership.set({
        serviceProvider: new Types.ObjectId(serviceProviderId),
        brand: new Types.ObjectId(createdBrand._id),
        isBrandOwner: true,
        ...(hasDefaultBrand ? { isDefault: false } : { isDefault: true }),
      });
      await createdBrandMembership.save({ session });

      await session.commitTransaction();
      return await this.getById(createdBrand._id);
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Error while creating branch ${error?.message}`, {
        error,
      });
      throw new InternalServerErrorException(
        new CustomError({
          localizedMessage: {
            en: 'An internal server error occurred. Please try again. The data you entered may be invalid',
            ar: 'حدث خطأ داخلي في الخادم. يرجى المحاولة مرة أخرى. قد تكون البيانات التي أدخلتها غير صحيحة',
          },
          error: ErrorType.BACKEND_CODE,
          event: 'BRAND_CREATION_TRANSACTION_ERROR',
        }),
      );
    } finally {
      await session.endSession();
    }
  }

  async getBrandById(serviceProviderId: string | Types.ObjectId, { brandId }: BrandIdParamDto) {
    await this.checkoutOwnership(serviceProviderId, brandId);

    const brand = await this.getById(brandId);
    if (!brand)
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Brand not found',
            ar: 'لا توجد هذه العلامة التجارية',
          },
          event: 'NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );

    return brand;
  }

  async updateBrand(serviceProviderId: string | Types.ObjectId, { brandId }: BrandIdParamDto, body: UpdateBrandDto) {
    const { coverPictureMedia, logoPictureMedia, ...restOfBody } = body;
    await this.checkoutOwnership(serviceProviderId, brandId);

    // let uploadedCoverPictureMedia: { media: Media[]; mediaProcessingId: string };
    // let uploadedLogoPictureMedia: { media: Media[]; mediaProcessingId: string };

    if (coverPictureMedia) {
      // uploadedCoverPictureMedia = await this.mediaUploadService.handleMediaUploads({
      //   files: [body.coverPictureMedia],
      //   filesS3PathPrefix: `${serviceProviderId}/brands/cover`,
      //   resourceModel: {
      //     name: UploadModelResources.BRANDS,
      //   },
      //   allowedMediaTypes: [MediaTypeEnum.IMAGE],
      // });

      await this.s3Service.copyObjectToMediaBucket(
        coverPictureMedia.s3Key,
        `${serviceProviderId}/brands/cover/${coverPictureMedia.s3Key}`,
      );
    }

    if (logoPictureMedia) {
      await this.s3Service.copyObjectToMediaBucket(
        logoPictureMedia.s3Key,
        `${serviceProviderId}/brands/logo/${logoPictureMedia.s3Key}`,
      );
      //   uploadedLogoPictureMedia = await this.mediaUploadService.handleMediaUploads({
      //     files: [body.logoPictureMedia],
      //     filesS3PathPrefix: `${serviceProviderId}/brands/logo`,
      //     resourceModel: {
      //       name: UploadModelResources.BRANDS,
      //     },
      //     allowedMediaTypes: [MediaTypeEnum.IMAGE],
      //   });
    }

    const brand = await this.brandModel.findById(brandId);
    brand.set({
      ...restOfBody,
      ...(logoPictureMedia && {
        logoPictureMedia: {
          type: MediaTypeEnum.IMAGE,
          url: `${this.appConfig.MEDIA_DOMAIN}/${serviceProviderId}/brands/logo/${logoPictureMedia.s3Key}`,
        },
      }),
      ...(coverPictureMedia && {
        coverPictureMedia: {
          type: MediaTypeEnum.IMAGE,
          url: `${this.appConfig.MEDIA_DOMAIN}/${serviceProviderId}/brands/cover/${coverPictureMedia.s3Key}`,
        },
      }),
    });
    await brand.save();

    return await this.getById(brandId);
  }

  async getAllSupplierBrands(
    serviceProviderId: string | Types.ObjectId,
    { limit = 20, page = 1 }: BasePaginationQuery,
  ) {
    const filter = { brandType: BrandTypeEnum.SUPPLIER };
    const [total, docs] = await Promise.all([
      this.brandModel.countDocuments(filter),
      this.brandModel
        .find(filter, { _id: 1, name: 1, logoPictureMedia: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async checkoutOwnership(serviceProviderId: string | Types.ObjectId, brandId: string | Types.ObjectId) {
    const isBrandOwner = await this.brandMembershipModel.exists({
      serviceProvider: new Types.ObjectId(serviceProviderId),
      brand: new Types.ObjectId(brandId),
      isBrandOwner: true,
    });
    if (!isBrandOwner) {
      throw new ForbiddenException(
        new CustomError({
          localizedMessage: {
            en: 'You are not allowed to perform this action',
            ar: 'لا يمكنك تنفيذ هذا الإجراء',
          },
          event: 'FORBIDDEN',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }
  }
  private async getById(brandId: string | Types.ObjectId) {
    const [brand] = await this.brandModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(brandId) },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phoneNumber: 1,
          anotherPhoneNumber: 1,
          bio: 1,
          coverPictureMedia: 1,
          logoPictureMedia: 1,
          hotline: 1,
        },
      },
    ]);

    return brand;
  }
}
