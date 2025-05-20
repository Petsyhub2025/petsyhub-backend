export enum CustomerEventsEnum {
  // Customer Account Events
  CUSTOMER_REGISTERED = 'customer.account.registered',
  CUSTOMER_LOGIN_SUCCESS = 'customer.account.login.success',
  CUSTOMER_LOGIN_FAILURE = 'customer.account.login.failure',
  CUSTOMER_PASSWORD_CHANGED = 'customer.account.password.changed',

  // Cart Events
  CUSTOMER_CART_ABANDONED_REMINDER = 'customer.cart.abandoned.reminder',

  // Order Events
  CUSTOMER_ORDER_PLACED = 'customer.order.placed',
  CUSTOMER_ORDER_PAYMENT_SUCCESS = 'customer.order.payment.success',
  CUSTOMER_ORDER_PAYMENT_FAILURE = 'customer.order.payment.failure',
  CUSTOMER_ORDER_PROCESSING = 'customer.order.processing',
  CUSTOMER_ORDER_OUT_FOR_DELIVERY = 'customer.order.outForDelivery',
  CUSTOMER_ORDER_DELIVERED = 'customer.order.delivered',
}
