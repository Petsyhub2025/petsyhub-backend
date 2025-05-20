export enum ServiceProviderEventsEnum {
  SERVICE_PROVIDER_DOCUMENTS_UPDATE = 'serviceProviders.post.save.updateServiceProviderDocument',
  SUSPEND_SERVICE_PROVIDER = 'serviceProviders.post.save.suspendServiceProvider',
  UNSUSPEND_SERVICE_PROVIDER = 'serviceProviders.post.save.unsuspendServiceProvider',

  SERVICE_PROVIDER_BRANCH_CREATED = 'serviceProviders.post.save.createBranch',
  SERVICE_PROVIDER_BRANCH_APPROVED = 'serviceProviders.post.save.approveBranch',
  SERVICE_PROVIDER_BRANCH_REJECTED = 'serviceProviders.post.save.rejectBranch',

  SERVICE_PROVIDER_REGISTERED = 'serviceProviders.registered',
  SERVICE_PROVIDER_LOGIN_SUCCESS = 'serviceProviders.login.success',
  SERVICE_PROVIDER_LOGIN_FAILURE = 'serviceProviders.login.failure',
  SERVICE_PROVIDER_PASSWORD_CHANGED = 'serviceProviders.password.changed',

  ORDER_PLACED = 'serviceProviders.orders.placed',
  ORDER_PAYMENT_SUCCESS = 'serviceProviders.orders.paymentSuccess',
  ORDER_PAYMENT_FAILED = 'serviceProviders.orders.paymentFailed',
  ORDER_CANCELLED = 'serviceProviders.orders.cancelled',
  ORDER_SCHEDULED = 'serviceProviders.orders.scheduled',
  ORDER_PROCESSING = 'serviceProviders.orders.processing',
  ORDER_OUT_FOR_DELIVERY = 'serviceProviders.orders.outForDelivery',
  ORDER_DELIVERED = 'serviceProviders.orders.delivered',
  ORDER_COMPLETED = 'serviceProviders.orders.completed',
}

export enum ServiceProviderStatusEnum {
  PENDING_ADMIN_APPROVAL = 'pendingAdminApproval',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}
