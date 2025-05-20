import { Body, Controller, Get, Param, Put, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AdminJwtPersona, CustomResponse, Persona, NoApiVersion, BasePaginationQuery } from '@instapets-backend/common';
import { OrderIdParamDto } from '@orders/shared/dto/order-id-param.dto';
import { UpdateShippingConfigDto } from './dto/update-shipping-config.dto';

@Controller({
  path: 'orders',
  version: VERSION_NEUTRAL,
})
@ApiTags('admin/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  async getOrders(@Persona() adminJWT: AdminJwtPersona, @Query() query: BasePaginationQuery) {
    const result = await this.ordersService.getOrders(query);
    return new CustomResponse().success({
      payload: result,
    });
  }

  @Get('shipping-configs')
  @ApiBearerAuth()
  @NoApiVersion()
  async getShippingConfigs(@Persona() adminJWT: AdminJwtPersona) {
    const result = await this.ordersService.getShippingConfig();
    return new CustomResponse().success({
      payload: { data: result },
    });
  }

  @Put('shipping-configs')
  @ApiBearerAuth()
  @NoApiVersion()
  async upsertShippingConfigs(@Persona() adminJWT: AdminJwtPersona, @Body() body: UpdateShippingConfigDto) {
    await this.ordersService.updateShippingConfig(body);
    return new CustomResponse().success({});
  }

  @Get(':orderId')
  @ApiBearerAuth()
  @NoApiVersion()
  async getOrderDetailsById(@Persona() adminJWT: AdminJwtPersona, @Param() param: OrderIdParamDto) {
    const order = await this.ordersService.getOrderDetails(adminJWT._id, param);
    return new CustomResponse().success({
      payload: { data: order },
    });
  }
}
