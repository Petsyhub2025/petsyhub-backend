import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@customers/shared/constants';
import { OrdersService } from './orders.service';
import { BasePaginationQuery, CustomerJwtPersona, CustomResponse, Persona } from '@instapets-backend/common';
import { PlaceOrderDto } from './dto/place-order.dto';
import { OrderIdParamDto } from '@orders/shared/dto/order-id-param.dto';

@Controller({
  path: 'orders',
  ...globalControllerVersioning,
})
@ApiTags('customer/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  async getMyOrders(@Persona() customerJWT: CustomerJwtPersona, @Query() query: BasePaginationQuery) {
    const orders = await this.ordersService.getMyOrders(customerJWT._id, query);
    return new CustomResponse().success({
      payload: orders,
    });
  }

  @Get('checkout')
  @ApiBearerAuth()
  async checkout(@Persona() customerJWT: CustomerJwtPersona) {
    const checkoutDetails = await this.ordersService.checkout(customerJWT._id);
    return new CustomResponse().success({
      payload: { data: checkoutDetails },
    });
  }

  @Post('place-order')
  @ApiBearerAuth()
  async placeOrder(@Persona() customerJWT: CustomerJwtPersona, @Body() placeOrderDto: PlaceOrderDto) {
    const placedOrder = await this.ordersService.placeOrder(customerJWT._id, placeOrderDto);
    return new CustomResponse().success({
      payload: { data: placedOrder },
    });
  }

  @Get(':orderId')
  @ApiBearerAuth()
  async getOrderById(@Persona() customerJWT: CustomerJwtPersona, @Param() param: OrderIdParamDto) {
    const order = await this.ordersService.getOrderById(customerJWT._id, param);
    return new CustomResponse().success({
      payload: { data: order },
    });
  }
}
