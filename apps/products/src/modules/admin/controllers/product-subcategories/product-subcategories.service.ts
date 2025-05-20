import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IProductSubCategoryModel,
  ModelNames,
  addPaginationStages,
  IProductCategoryModel,
  AwsS3Service,
  AppConfig,
  GetImagePreSignedUrlQueryDto,
  CustomError,
  ErrorType,
} from '@instapets-backend/common';
import { errorManager } from '@products/admin/shared/config/errors.config';
import { CreateProductSubCategoryDto } from './dto/create-product-subcategory.dto';
import { ProductSubCategoryIdParamDto } from '@products/shared/dto/product-subcategory-param-id.dto';
import { UpdateProductSubCategoryDto } from './dto/update-product-subcategory.dto';
import { Types } from 'mongoose';
import { GetSubCategoriesQueryDto } from './dto/get-subcategories.dto';

@Injectable()
export class ProductSubCategoriesService {
  constructor(
    @Inject(ModelNames.PRODUCT_SUBCATEGORY) private productSubCategoryModel: IProductSubCategoryModel,
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
    const filePath = `${adminId}/product-subcategory/${revisedFilename}`;
    const preSignedUrl = await this.s3Service.generatePresignedUrl(filePath);
    const cloudFrontUrl = `${this.appConfig.MEDIA_DOMAIN}/${filePath}`;

    return {
      preSignedUrl,
      cloudFrontUrl,
    };
  }

  async createProductSubCategory(adminId: string, body: CreateProductSubCategoryDto) {
    const { name, iconMedia, productCategory } = body;

    if (
      await this.productSubCategoryModel.exists({
        name,
      })
    ) {
      throw new ConflictException(errorManager.PRODUCT_SUBCATEGORY_NAME_ALREADY_EXISTS);
    }

    if (!(await this.productCategoryModel.exists({ _id: new Types.ObjectId(productCategory) }))) {
      throw new NotFoundException(errorManager.PRODUCT_CATEGORY_NOT_FOUND);
    }

    const newProductSubCategory = new this.productSubCategoryModel({
      name,
      iconMedia,
      productCategory: new Types.ObjectId(productCategory),
    });

    await newProductSubCategory.save();
  }

  async updateProductSubCategory(
    adminId: string,
    { productSubCategoryId }: ProductSubCategoryIdParamDto,
    body: UpdateProductSubCategoryDto,
  ) {
    const { name, iconMedia, productCategory } = body;

    if (name && (await this.productSubCategoryModel.exists({ _id: { $ne: productSubCategoryId }, name }))) {
      throw new ConflictException(errorManager.PRODUCT_SUBCATEGORY_NAME_ALREADY_EXISTS);
    }

    if (!(await this.productCategoryModel.exists({ _id: new Types.ObjectId(productCategory) }))) {
      throw new NotFoundException(errorManager.PRODUCT_CATEGORY_NOT_FOUND);
    }

    const productSubCategory = await this.productSubCategoryModel.findById(productSubCategoryId);
    if (!productSubCategory) {
      throw new NotFoundException(errorManager.PRODUCT_SUBCATEGORY_NOT_FOUND);
    }

    productSubCategory.set({
      ...(name && { name }),
      ...(iconMedia && { iconMedia }),
      ...(productCategory && { productCategory: new Types.ObjectId(productCategory) }),
    });
    await productSubCategory.save();
  }

  async getProductSubCategories(adminId: string, query: GetSubCategoriesQueryDto) {
    const { page, limit, productCategory } = query;
    const matchStage = [
      {
        $match: {
          ...(productCategory && { productCategory: new Types.ObjectId(productCategory) }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productSubCategoryModel.aggregate(matchStage).count('total'),
      this.productSubCategoryModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        {
          $project: {
            name: 1,
            iconMedia: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getProductSubCategoryById(adminId: string, { productSubCategoryId }: ProductSubCategoryIdParamDto) {
    const productSubCategory = await this.productSubCategoryModel
      .findById(productSubCategoryId, { name: 1, iconMedia: 1 })
      .lean();
    if (!productSubCategory) {
      throw new NotFoundException(errorManager.PRODUCT_SUBCATEGORY_NOT_FOUND);
    }

    return productSubCategory;
  }
}
