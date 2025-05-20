import { Injectable } from '@nestjs/common';
import {
  petsyTemplate,
  otpTemplate,
  forgotPasswordTemplate,
  resetPasswordTemplate,
  accountBlockedTemplate,
  accountSuspendedTemplate,
  verifyServiceProviderTemplate,
  customerWelcomeTemplate,
  loginSuccessTemplate,
  loginFailureTemplate,
  passwordChangedTemplate,
  orderOutForDeliveryTemplate,
  orderPaymentSuccessTemplate,
  orderDeliveredTemplate,
  orderInvoiceTemplate,
  serviceProviderWelcomeTemplate,
  serviceProviderOrderPlacedTemplate,
  serviceProviderPaymentSuccessTemplate,
  serviceProviderOrderScheduledTemplate,
  serviceProviderOrderProcessingTemplate,
  serviceProviderOrderOutForDeliveryTemplate,
  serviceProviderOrderDeliveredTemplate,
  serviceProviderOrderCompletedTemplate,
  serviceProviderBranchSubmittedTemplate,
  serviceProviderShopApprovedTemplate,
  serviceProviderShopRejectedTemplate,
  orderProcessingTemplate,
} from '../../templates';
import { BaseBranch } from '@common/schemas/mongoose/branch/base-branch.type';
import { Customer } from '@common/schemas/mongoose/customer/customer.type';
import { Order } from '@common/schemas/mongoose/order/order.type';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class TemplateManagerService {
  getOtpEmail(name: string, code: string): string {
    return otpTemplate(name, code);
  }

  getResetPasswordEmail(name: string, link: string): string {
    return resetPasswordTemplate(name, link);
  }

  getForgotPasswordEmail(name: string, code: string): string {
    return forgotPasswordTemplate(name, code);
  }

  getAccountSuspendedEmail(name: string): string {
    return accountSuspendedTemplate(name);
  }

  getAccountBlockedEmail(name: string, blockUntil: Date): string {
    return accountBlockedTemplate(name, blockUntil);
  }

  getVerifyServiceProviderEmail(name: string, token: string): string {
    return verifyServiceProviderTemplate(name, token);
  }

  // Future templates
  // getOrderConfirmation(name: string, orderId: string): string { ... }

  getCustomerWelcomeEmail(name: string) {
    return customerWelcomeTemplate(name);
  }

  getLoginSuccessEmail(name: string) {
    return loginSuccessTemplate(name);
  }

  getLoginFailureEmail(name: string) {
    return loginFailureTemplate(name);
  }

  getPasswordChangedEmail(name: string) {
    return passwordChangedTemplate(name);
  }

  // getCartReminderEmail(name: string, cartLink: string) {
  //   return cartReminderTemplate(name, cartLink);
  // }

  // getOrderConfirmedEmail(name: string, orderId: string) {
  //   return orderConfirmedTemplate(name, orderId);
  // }

  getOrderPaymentSuccessEmail(name: string, generatedUniqueId: string) {
    return orderPaymentSuccessTemplate(name, generatedUniqueId);
  }

  // getOrderPaymentFailedEmail(name: string, orderId: string, paymentLink: string) {
  //   return orderPaymentFailedTemplate(name, orderId, paymentLink);
  // }

  getOrderProcessingEmail(name: string, orderId: string): string {
    return orderProcessingTemplate(name, orderId);
  }

  getOrderOutForDeliveryEmail(name: string, generatedUniqueId: string) {
    return orderOutForDeliveryTemplate(name, generatedUniqueId);
  }

  getOrderDeliveredEmail(name: string, generatedUniqueId: string) {
    return orderDeliveredTemplate(name, generatedUniqueId);
  }

  getOrderInvoiceEmail(
    customer: HydratedDocument<Customer>,
    order: HydratedDocument<Order>,
    shop: HydratedDocument<BaseBranch>,
    orderedProducts: { name: string; price: number; quantity: number; total: number; sku: string }[],
    customerAddress: string,
    shopAddress: string,
  ) {
    return orderInvoiceTemplate(customer, order, shop, orderedProducts, customerAddress, shopAddress);
  }

  getServiceProviderWelcomeEmail(name: string): string {
    return serviceProviderWelcomeTemplate(name);
  }
  getServiceProviderOrderPlacedEmail(name: string, orderId: string, shopName: string): string {
    return serviceProviderOrderPlacedTemplate(name, orderId, shopName);
  }

  getServiceProviderPaymentSuccessEmail(name: string, orderId: string, shopname: string): string {
    return serviceProviderPaymentSuccessTemplate(name, orderId, shopname);
  }

  getServiceProviderOrderScheduledEmail(name: string, orderId: string, shopName: string): string {
    return serviceProviderOrderScheduledTemplate(name, orderId, shopName);
  }

  getServiceProviderOrderProcessingEmail(name: string, orderId: string, shopName: string): string {
    return serviceProviderOrderProcessingTemplate(name, orderId, shopName);
  }

  getServiceProviderOrderOutForDeliveryEmail(name: string, orderId: string, shopName: string): string {
    return serviceProviderOrderOutForDeliveryTemplate(name, orderId, shopName);
  }

  getServiceProviderOrderDeliveredEmail(name: string, orderId: string, shopName: string): string {
    return serviceProviderOrderDeliveredTemplate(name, orderId, shopName);
  }

  getServiceProviderOrderCompletedEmail(name: string, orderId: string, shopName: string): string {
    return serviceProviderOrderCompletedTemplate(name, orderId, shopName);
  }

  getServiceProviderBranchSubmittedEmail(name: string, shopName: string): string {
    return serviceProviderBranchSubmittedTemplate(name, shopName);
  }

  getServiceProviderShopApprovedEmail(name: string, shopName: string): string {
    return serviceProviderShopApprovedTemplate(name, shopName);
  }

  getServiceProviderShopRejectedEmail(name: string, shopName: string, reason?: string): string {
    return serviceProviderShopRejectedTemplate(name, shopName, reason);
  }
}
