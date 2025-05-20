import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  addPaginationStages,
  AppConfig,
  AwsS3Service,
  BasePaginationQuery,
  CustomError,
  ErrorType,
  GetImagePreSignedUrlQueryDto,
  IBrandModel,
  ModelNames,
} from '@instapets-backend/common';
import { Types } from 'mongoose';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandIdParamDto } from '@brands/shared/dto/brand-id-param.dto';
import { BrandTypeEnum } from '@common/schemas/mongoose/brand/brand.enum';

@Injectable()
export class BrandService {
  constructor(
    @Inject(ModelNames.BRAND)
    private brandModel: IBrandModel,
    private readonly s3Service: AwsS3Service,
    private appConfig: AppConfig,
  ) {}
  async generatePresignedUrl(adminId: string, { filename }: GetImagePreSignedUrlQueryDto) {
    const fileExtension = filename.split('.').pop();

    if (!fileExtension) {
      throw new BadRequestException(
        new CustomError({
          localizedMessage: {
            en: 'File extension is missing',
            ar: 'مطلوب امتداد الملف',
          },
          event: 'FILE_EXTENSION_REQUIRED',
          errorType: ErrorType.WRONG_INPUT,
        }),
      );
    }

    const revisedFilename = `media-uploads-${adminId}-${Date.now()}.${fileExtension}`;
    const filePath = `${adminId}/products/${revisedFilename}`;
    const preSignedUrl = await this.s3Service.generatePresignedUrl(filePath);
    const cloudFrontUrl = `${this.appConfig.MEDIA_DOMAIN}/${filePath}`;

    return {
      preSignedUrl,
      cloudFrontUrl,
    };
  }

  async createBrand(adminId: string | Types.ObjectId, body: CreateBrandDto) {
    const { logoPictureMedia, name } = body;

    //TODO: Handling BrandType 'SERVICE_PROVIDER'
    const createdBrand = new this.brandModel();
    createdBrand.set({
      name,
      logoPictureMedia,
      brandType: BrandTypeEnum.SUPPLIER,
    });
    await createdBrand.save();
  }

  async getAllBrands(adminId: string | Types.ObjectId, basePaginationQuery: BasePaginationQuery) {
    const { page, limit } = basePaginationQuery;
    const matchStage = [{ $match: { brandType: BrandTypeEnum.SUPPLIER } }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.brandModel.aggregate(matchStage).count('total'),
      this.brandModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        {
          $project: {
            name: 1,
            logoPictureMedia: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getBrandById(adminId: string | Types.ObjectId, { brandId }: BrandIdParamDto) {
    const brand = await this.brandModel.findById(brandId, { name: 1, logoPictureMedia: 1 });
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
}
