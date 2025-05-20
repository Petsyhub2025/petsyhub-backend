import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { globalControllerVersioning } from '@customers/shared/constants';
import { CustomerJwtPersona, CustomResponse, Persona } from '@instapets-backend/common';
import { ProductIdParamDto } from '@customers/customer/shared/dto/product-id-param.dto';
import { AddListToCartDto } from './dto/add-lits-to-cart.dto';

@Controller({
  path: 'cart',
  ...globalControllerVersioning,
})
@ApiTags('customer/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('products')
  @ApiBearerAuth()
  async addToCart(@Persona() customerJWT: CustomerJwtPersona, @Body() body: AddToCartDto) {
    await this.cartService.addToCart(customerJWT._id, body);
    return new CustomResponse().success({});
  }

  @Get('products')
  @ApiBearerAuth()
  async getCartList(@Persona() customerJWT: CustomerJwtPersona) {
    const cartList = await this.cartService.getCartList(customerJWT._id);
    return new CustomResponse().success({
      payload: { data: cartList },
    });
  }

  @Delete('products')
  @ApiBearerAuth()
  async clearCustomerCartProducts(@Persona() customerJWT: CustomerJwtPersona) {
    await this.cartService.clearCustomerCartProducts(customerJWT._id);
    return new CustomResponse().success({});
  }

  @Post('products/list')
  @ApiBearerAuth()
  async addListToCart(@Persona() customerJWT: CustomerJwtPersona, @Body() body: AddListToCartDto) {
    await this.cartService.addListOfProductsToCart(customerJWT._id, body);
    return new CustomResponse().success({});
  }

  @Delete('products/:productId')
  @ApiBearerAuth()
  async deleteCartProduct(@Persona() customerJWT: CustomerJwtPersona, @Param() param: ProductIdParamDto) {
    await this.cartService.deleteCartProduct(customerJWT._id, param);
    return new CustomResponse().success({});
  }
}
