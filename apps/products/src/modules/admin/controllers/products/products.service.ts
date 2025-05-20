import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ModelNames,
  addPaginationStages,
  AwsS3Service,
  AppConfig,
  IProductModel,
  GetImagePreSignedUrlQueryDto,
  CustomError,
  ErrorType,
  IProductCategoryModel,
  IProductSubCategoryModel,
} from '@instapets-backend/common';
import { errorManager } from '@products/admin/shared/config/errors.config';
import { CreateProductDto } from './dto/create-product.dto';
import { isValidObjectId, Types } from 'mongoose';
import { ProductIdParamDto } from '@products/shared/dto/product-param-id.dto';
import { productsAggregationPipeline } from './aggregations/products-pipeline.aggregation';
import { productDetailsAggregationPipeline } from './aggregations/product-details-pipeline.aggregation';
import { GetProductsDto } from './dto/get-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(ModelNames.PRODUCT) private productModel: IProductModel,
    @Inject(ModelNames.PRODUCT_CATEGORY) private categoryModel: IProductCategoryModel,
    @Inject(ModelNames.PRODUCT_SUBCATEGORY) private subCategoryModel: IProductSubCategoryModel,
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

  async createProduct(adminId: string, body: CreateProductDto) {
    const { name, description, media, supplier, category, subCategory, petTypes } = body;

    const categoryDoc = await this.categoryModel.findById(category).lean();
    const subCategoryDoc = await this.subCategoryModel.findById(subCategory).lean();

    const sku = this.generateSku({
      name: name.en || '',
      categoryName: categoryDoc?.name.en || '',
      subCategoryName: subCategoryDoc?.name.en || '',
    });

    const newProduct = new this.productModel({
      name,
      sku,
      description,
      media,
      supplier: new Types.ObjectId(supplier),
      category: new Types.ObjectId(category),
      subCategory: new Types.ObjectId(subCategory),
      petTypes: petTypes.map((petType) => new Types.ObjectId(petType)),
    });

    await newProduct.save();
  }

  async getProducts(adminId: string, query: GetProductsDto) {
    const { page, limit, supplierId } = query;
    const matchStage = [
      {
        $match: {
          ...(supplierId && { supplier: new Types.ObjectId(supplierId) }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.productModel.aggregate(matchStage).count('total'),
      this.productModel.aggregate([
        ...matchStage,
        ...addPaginationStages({ page, limit }),
        ...productsAggregationPipeline(supplierId),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getProductById(adminId: string, { productId }: ProductIdParamDto) {
    const [product] = await this.productModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(productId),
        },
      },
      ...productDetailsAggregationPipeline(),
    ]);
    if (!product) {
      throw new NotFoundException(errorManager.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  private generateSku({
    name,
    categoryName,
    subCategoryName,
  }: {
    name: string;
    categoryName: string;
    subCategoryName: string;
  }): string {
    const clean = (str: string) =>
      str
        .normalize('NFD') // Normalize accents
        .replace(/[\u0300-\u036f]/g, '') // Strip diacritics
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .slice(0, 4)
        .toUpperCase();

    const cat = clean(categoryName);
    const sub = clean(subCategoryName);
    const product = clean(name);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5-char suffix

    return `${cat}-${sub}-${product}-${random}`;
  }
}
