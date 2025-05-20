import { CustomError, ErrorType, Order, OrderStatusEnum } from '@instapets-backend/common';
import { ConflictException, Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class OrderStatusEnumValidator {
  constructor() {}
  private StatusHirarchy = {
    '': [OrderStatusEnum.PLACED],
    '': [OrderStatusEnum.SCHEDULED],
    [OrderStatusEnum.PLACED]: [OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.SCHEDULED]: [OrderStatusEnum.PROCESSING],
    [OrderStatusEnum.PROCESSING]: [OrderStatusEnum.OUT_FOR_DELIVERY],
    [OrderStatusEnum.OUT_FOR_DELIVERY]: [OrderStatusEnum.DELIVERED],
    [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.COMPLETED],
    [OrderStatusEnum.COMPLETED]: [],
  };

  isStatusValidForOrder(order: HydratedDocument<Order>, newStatus: OrderStatusEnum) {
    if (this.StatusHirarchy[order.status].includes(newStatus)) return true;

    throw new ConflictException(
      new CustomError({
        localizedMessage: {
          en: 'Order status not valid for this operation',
          ar: 'حالة الطلب غير صالحة لهذه العملية',
        },
        errorType: ErrorType.CONFLICT,
        event: 'ORDER_STATUS_NOT_VALID',
      }),
    );
  }
}
