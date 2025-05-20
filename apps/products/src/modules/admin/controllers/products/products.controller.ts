import { Body, Controller, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
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
import { CreateProductDto } from './dto/create-product.dto';
import { ProductIdParamDto } from '@products/shared/dto/product-param-id.dto';
import { GetProductsDto } from './dto/get-products.dto';

@Controller({ path: 'products', version: VERSION_NEUTRAL })
@ApiTags('admin/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCTS, operation: AdminResourceOperationsEnum.CREATE })
  async createProduct(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateProductDto) {
    await this.productsService.createProduct(adminJWT._id, body);

    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCTS, operation: AdminResourceOperationsEnum.READ })
  async getProducts(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetProductsDto) {
    const products = await this.productsService.getProducts(adminJWT._id, query);
    return new CustomResponse().success({
      payload: products,
    });
  }

  @ApiBearerAuth()
  @Get('pre-signed-url')
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCTS, operation: AdminResourceOperationsEnum.UPDATE })
  async getUploadPreSignedUrl(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetImagePreSignedUrlQueryDto) {
    const data = await this.productsService.generatePresignedUrl(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data },
    });
  }

  @Get(':productId')
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.PRODUCTS, operation: AdminResourceOperationsEnum.READ })
  async getProductById(@Persona() adminJWT: AdminJwtPersona, @Param() param: ProductIdParamDto) {
    const product = await this.productsService.getProductById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: product,
      },
    });
  }
}
