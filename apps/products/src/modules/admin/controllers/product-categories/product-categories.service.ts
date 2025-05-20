import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IProductCategoryModel,
  ModelNames,
  addPaginationStages,
  BasePaginationQuery,
  AwsS3Service,
  AppConfig,
  GetImagePreSignedUrlQueryDto,
  CustomError,
  ErrorType,
} from '@instapets-backend/common';
import { errorManager } from '@products/admin/shared/config/errors.config';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ProductCategoryIdParamDto } from '@products/shared/dto/product-category-param-id.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @Inject(ModelNames.PRODUCT_CATEGORY) private productCategoryModel: IProductCategoryModel,
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
    const filePath = `${adminId}/product-category/${revisedFilename}`;
    const preSignedUrl = await this.s3Service.generatePresignedUrl(filePath);
    const cloudFrontUrl = `${this.appConfig.MEDIA_DOMAIN}/${filePath}`;

    return {
      preSignedUrl,
      cloudFrontUrl,
    };
  }

  async createProductCategory(adminId: string, body: CreateProductCategoryDto) {
    const { name, description, iconMedia } = body;

    if (
      await this.productCategoryModel.exists({
        name,
      })
    ) {
      throw new ConflictException(errorManager.PRODUCT_CATEGORY_NAME_ALREADY_EXISTS);
    }

    const newProductCategory = new this.productCategoryModel({
      name,
      description,
      iconMedia,
    });

    await newProductCategory.save();
  }

  async updateProductCategory(
    adminId: string,
    { productCategoryId }: ProductCategoryIdParamDto,
    body: UpdateProductCategoryDto,
  ) {
    const { name, iconMedia, description } = body;

    if (name && (await this.productCategoryModel.exists({ _id: { $ne: productCategoryId }, name }))) {
      throw new ConflictException(errorManager.PRODUCT_CATEGORY_NAME_ALREADY_EXISTS);
    }

    const productCategory = await this.productCategoryModel.findById(productCategoryId);
    if (!productCategory) {
      throw new NotFoundException(errorManager.PRODUCT_CATEGORY_NOT_FOUND);
    }

    productCategory.set({
      ...(name && { name }),
      ...(description && { description }),
      ...(iconMedia && { iconMedia }),
    });
    await productCategory.save();
  }

  async getProductCategories(adminId: string, query: BasePaginationQuery) {
    const { page, limit } = query;
    const matchStage = [{ $match: {} }];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productCategoryModel.aggregate(matchStage).count('total'),
      this.productCategoryModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        {
          $project: {
            name: 1,
            description: 1,
            iconMedia: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getProductCategoryById(adminId: string, { productCategoryId }: ProductCategoryIdParamDto) {
    const productCategory = await this.productCategoryModel
      .findById(productCategoryId, { name: 1, description: 1, iconMedia: 1 })
      .lean();
    if (!productCategory) {
      throw new NotFoundException(errorManager.PRODUCT_CATEGORY_NOT_FOUND);
    }

    return productCategory;
  }
}
