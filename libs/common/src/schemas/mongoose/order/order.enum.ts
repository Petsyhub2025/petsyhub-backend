export enum OrderPaymentMethodTypeEnum {
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum OrderStatusEnum {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PLACED = 'PLACED',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatusEnum {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}
