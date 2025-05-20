import { Body, Controller, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  BasePaginationQuery,
  CustomResponse,
  GetImagePreSignedUrlQueryDto,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoryIdParamDto } from '@products/shared/dto/product-category-param-id.dto';

@Controller({ path: 'product-categories', version: VERSION_NEUTRAL })
@ApiTags('admin/product-categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.CREATE })
  async createProductCategory(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateProductCategoryDto) {
    await this.productCategoriesService.createProductCategory(adminJWT._id, body);

    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.READ })
  async getProductCategories(@Persona() adminJWT: AdminJwtPersona, @Query() query: BasePaginationQuery) {
    const productCategories = await this.productCategoriesService.getProductCategories(adminJWT._id, query);
    return new CustomResponse().success({
      payload: productCategories,
    });
  }

  @ApiBearerAuth()
  @Get('pre-signed-url')
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.UPDATE })
  async getUploadPreSignedUrl(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetImagePreSignedUrlQueryDto) {
    const data = await this.productCategoriesService.generatePresignedUrl(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data },
    });
  }

  @Patch(':productCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateProductCategory(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: ProductCategoryIdParamDto,
    @Body() body: UpdateProductCategoryDto,
  ) {
    await this.productCategoriesService.updateProductCategory(adminJWT._id, params, body);

    return new CustomResponse().success({});
  }

  @Get(':productCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.READ })
  async getProductCategoryById(@Persona() adminJWT: AdminJwtPersona, @Param() param: ProductCategoryIdParamDto) {
    const productCategory = await this.productCategoriesService.getProductCategoryById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: productCategory,
      },
    });
  }
}
