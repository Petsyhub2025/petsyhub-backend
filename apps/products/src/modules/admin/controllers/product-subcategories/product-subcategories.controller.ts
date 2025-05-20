import { Body, Controller, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  GetImagePreSignedUrlQueryDto,
  NoApiVersion,
  Persona,
} from '@instapets-backend/common';
import { ProductSubCategoriesService } from './product-subcategories.service';
import { CreateProductSubCategoryDto } from './dto/create-product-subcategory.dto';
import { ProductSubCategoryIdParamDto } from '@products/shared/dto/product-subcategory-param-id.dto';
import { UpdateProductSubCategoryDto } from './dto/update-product-subcategory.dto';
import { GetSubCategoriesQueryDto } from './dto/get-subcategories.dto';

@Controller({ path: 'product-sub-categories', version: VERSION_NEUTRAL })
@ApiTags('admin/product-sub-categories')
export class ProductSubCategoriesController {
  constructor(private readonly productSubCategoriesService: ProductSubCategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.CREATE })
  async createProductSubCategory(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateProductSubCategoryDto) {
    await this.productSubCategoriesService.createProductSubCategory(adminJWT._id, body);

    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.READ })
  async getProductSubCategories(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetSubCategoriesQueryDto) {
    const productSubCategories = await this.productSubCategoriesService.getProductSubCategories(adminJWT._id, query);
    return new CustomResponse().success({
      payload: productSubCategories,
    });
  }

  @ApiBearerAuth()
  @Get('pre-signed-url')
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.UPDATE })
  async getUploadPreSignedUrl(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetImagePreSignedUrlQueryDto) {
    const data = await this.productSubCategoriesService.generatePresignedUrl(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data },
    });
  }

  @Patch(':productSubCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.UPDATE })
  async updateProductSubCategory(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() params: ProductSubCategoryIdParamDto,
    @Body() body: UpdateProductSubCategoryDto,
  ) {
    await this.productSubCategoriesService.updateProductSubCategory(adminJWT._id, params, body);

    return new CustomResponse().success({});
  }

  @Get(':productSubCategoryId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCT_CATEGORIES, operation: AdminResourceOperationsEnum.READ })
  async getProductSubCategoryById(@Persona() adminJWT: AdminJwtPersona, @Param() param: ProductSubCategoryIdParamDto) {
    const productSubCategory = await this.productSubCategoriesService.getProductSubCategoryById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: productSubCategory,
      },
    });
  }
}
