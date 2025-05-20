import { Body, Controller, Get, Param, Patch, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  ServiceProviderJwtPersona,
  CustomResponse,
  Persona,
  NoApiVersion,
  ServiceProviderPermission,
  BranchAccessResourcesEnum,
  BranchAccessResourceOperationsEnum,
} from '@instapets-backend/common';
import { GetOrdersDto } from './dto/get-orders.dto';
import { BranchIdQueryDto } from '@orders/shared/dto/branch-id-query.dto';
import { OrderIdParamDto } from '@orders/shared/dto/order-id-param.dto';
import { UpdateOrderStatusDto } from './dto/udpate-order-status.dto';
import { UpdateOrderPaymentStatusDto } from './dto/udpate-order-payment-status.dto';
import { GetOrdersAnalyticsDto } from './dto/orders-analytics.dto';

@Controller({
  path: 'orders',
  version: VERSION_NEUTRAL,
})
@ApiTags('serviceProvider/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.ORDERS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getOrders(@Persona() serviceProviderJWT: ServiceProviderJwtPersona, @Query() getOrdersDto: GetOrdersDto) {
    const result = await this.ordersService.getOrders(getOrdersDto);
    return new CustomResponse().success({
      payload: result,
    });
  }

  @Get('analytics')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.ORDERS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getOrdersAnalytics(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Query() query: GetOrdersAnalyticsDto,
  ) {
    const result = await this.ordersService.getOrderAnalytics(serviceProviderJWT._id, query);
    return new CustomResponse().success({
      payload: { data: result },
    });
  }

  @Get(':orderId')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.ORDERS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getOrderDetailsById(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Query() query: BranchIdQueryDto,
    @Param() param: OrderIdParamDto,
  ) {
    const order = await this.ordersService.getOrderDetails(serviceProviderJWT._id, param, query);
    return new CustomResponse().success({
      payload: { data: order },
    });
  }

  @Patch(':orderId')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.ORDERS,
    operation: BranchAccessResourceOperationsEnum.UPDATE,
  })
  async updateOrderStatus(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Param() param: OrderIdParamDto,
    @Body() body: UpdateOrderStatusDto,
  ) {
    await this.ordersService.updateOrderStatus(serviceProviderJWT._id, param, body);
    return new CustomResponse().success({});
  }

  @Patch(':orderId/payment-status')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.ORDERS,
    operation: BranchAccessResourceOperationsEnum.UPDATE,
  })
  async updateOrderPaymentStatus(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Param() param: OrderIdParamDto,
    @Body() body: UpdateOrderPaymentStatusDto,
  ) {
    await this.ordersService.updateOrderPaymentStatus(serviceProviderJWT._id, param, body);
    return new CustomResponse().success({});
  }
}
