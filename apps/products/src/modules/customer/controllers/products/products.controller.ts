import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CustomerJwtPersona, CustomResponse, Persona, IsPrivateAuthOrPublic } from '@instapets-backend/common';
import { ProductIdParamDto } from '@products/shared/dto/product-param-id.dto';
import { globalControllerVersioning } from '@products/shared/constants';
import { DiscoverAllProductsDto } from './dto/discover-products.dto';
import { AvailableShopsForProductDto } from './dto/available-shops-list.dto';
import { GetAllProductsDto } from './dto/get-products.dto';
import { GetPricedProductDetailsDto } from './dto/get-priced-product.dto';

@Controller({ path: 'products', ...globalControllerVersioning })
@ApiTags('customer/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('priced')
  @ApiBearerAuth()
  async getAllProducts(@Persona() customerJWT: CustomerJwtPersona, @Query() query: GetAllProductsDto) {
    const products = await this.productsService.getShopPricedProducts(query, customerJWT._id);
    return new CustomResponse().success({
      payload: products,
    });
  }

  @Get('public/priced')
  @IsPrivateAuthOrPublic()
  async getAllProductsGuest(@Query() query: GetAllProductsDto) {
    const products = await this.productsService.getShopPricedProducts(query);
    return new CustomResponse().success({
      payload: products,
    });
  }

  @Get('discovery')
  @ApiBearerAuth()
  async discoverAllProducts(@Persona() customerJWT: CustomerJwtPersona, @Query() query: DiscoverAllProductsDto) {
    const products = await this.productsService.discoverAllProducts(query, customerJWT._id);
    return new CustomResponse().success({
      payload: products,
    });
  }

  @Get('public/discovery')
  @IsPrivateAuthOrPublic()
  async discoverAllProductsGuest(@Query() query: DiscoverAllProductsDto) {
    const products = await this.productsService.discoverAllProducts(query);
    return new CustomResponse().success({
      payload: products,
    });
  }

  @Get('discovery/details/:productId')
  @ApiBearerAuth()
  async getProductById(@Persona() customerJWT: CustomerJwtPersona, @Param() param: ProductIdParamDto) {
    const product = await this.productsService.discoverProductById(param, customerJWT._id);
    return new CustomResponse().success({
      payload: {
        data: product,
      },
    });
  }

  @Get('public/discovery/details/:productId')
  @IsPrivateAuthOrPublic()
  async getProductByIdGuest(@Param() param: ProductIdParamDto) {
    const product = await this.productsService.discoverProductById(param);
    return new CustomResponse().success({
      payload: {
        data: product,
      },
    });
  }

  @Get('priced/details/:productId')
  @ApiBearerAuth()
  async getPricedProductById(
    @Persona() customerJWT: CustomerJwtPersona,
    @Param() param: ProductIdParamDto,
    @Query() query: GetPricedProductDetailsDto,
  ) {
    const product = await this.productsService.getPricedProductDetailsById(param, query, customerJWT._id);
    return new CustomResponse().success({
      payload: {
        data: product,
      },
    });
  }

  @Get('public/priced/details/:productId')
  @IsPrivateAuthOrPublic()
  async getPricedProductByIdGuest(@Param() param: ProductIdParamDto, @Query() query: GetPricedProductDetailsDto) {
    const product = await this.productsService.getPricedProductDetailsById(param, query);
    return new CustomResponse().success({
      payload: {
        data: product,
      },
    });
  }

  @Get('discovery/details/:productId/shops')
  @ApiBearerAuth()
  async getAvailableShopsForProduct(
    @Persona() customerJWT: CustomerJwtPersona,
    @Param() param: ProductIdParamDto,
    @Query() query: AvailableShopsForProductDto,
  ) {
    const shops = await this.productsService.getAvailableShopsForProduct(param, query, customerJWT._id);
    return new CustomResponse().success({
      payload: shops,
    });
  }

  @Get('public/discovery/details/:productId/shops')
  @IsPrivateAuthOrPublic()
  async getAvailableShopsForProductGuest(
    @Param() param: ProductIdParamDto,
    @Query() query: AvailableShopsForProductDto,
  ) {
    const shops = await this.productsService.getAvailableShopsForProduct(param, query);
    return new CustomResponse().success({
      payload: shops,
    });
  }
}
