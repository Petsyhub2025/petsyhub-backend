import { BaseBranch } from '@common/schemas/mongoose/branch/base-branch.type';
import { Customer } from '@common/schemas/mongoose/customer/customer.type';
import { Order } from '@common/schemas/mongoose/order/order.type';
import { HydratedDocument } from 'mongoose';

export const orderInvoiceTemplate = (
  customer: HydratedDocument<Customer>,
  order: HydratedDocument<Order>,
  shop: HydratedDocument<BaseBranch>,
  orderedProducts: { name: string; sku: string; quantity: number; price: number; total: number }[],
  customerAddress: string,
  shopAddress: string,
): string => {
  const orderDate = order.createdAt;
  const offsetUTC = new Date().getTimezoneOffset;

  const itemsHtml = orderedProducts
    .map(
      (item) => `
      <tr style="border-top: 1px solid #eee;">
        <td>${item.name}</td>
        <td>${item.sku ?? ''}</td>
        <td style="text-align: right;">${item.price}</td>
        <td style="text-align: right;">${item.quantity}</td>
        <td style="text-align: right;">${item.total}</td>
      </tr>
    `,
    )
    .join('');

  return `
  <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet" />
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Lato', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" width="600" align="center"
            style="background: #ffffff; border-collapse: collapse; box-shadow: 0 0 5px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="padding: 20px;">
                <table width="100%">
                  <tr>
                    <td style="text-align: left; vertical-align: top;">
                      <img src="https://instapets-public-assets.s3.eu-central-1.amazonaws.com/logos/petsyhub_logo.png"
                        alt="Petsy Logo" width="125" />
                    </td>
                    <td align="right" style="font-size: 14px; color: #666;">
                      <strong>Invoice ${order.generatedUniqueId}</strong><br />
                      <span>Date: <strong>${order.createdAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        timeZone: 'Asia/Dubai',
                      })}</strong></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Thank You Message -->
            <tr>
              <td style="padding: 0 20px 10px 20px;">
                <p style="font-size: 20px; color: #333; margin-bottom: 5px;">
                  Thank you for your purchase with <strong>PetsyHub</strong>! 🐾
                </p>
                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                  Below you'll find the invoice for your most recent order <strong>#${order.generatedUniqueId}</strong>
                  placed on <strong>${order.createdAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Dubai',
                  })}</strong>.
                  This summary includes a breakdown of the items, shipping, and total amount.
                </p>
              </td>
            </tr>

            <!-- Invoice To/From -->
            <tr style="background: #fdf6f2;">
              <td style="padding: 24px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6;">
                  <tr>
                    <td width="50%" valign="top" style="padding-right: 10px;">
                      <strong style="display: block; margin-bottom: 5px;">Invoice To</strong>
                      <div style="font-weight: bold; margin-bottom: 4px;">${customer.firstName} ${
                        customer.lastName
                      }</div>
                      <div>${customerAddress}</div>
                      <div>${customer.phoneNumber}</div>
                      <div>${customer.email}</div>
                    </td>
                    <td width="50%" valign="top" style="padding-left: 10px;">
                      <strong style="display: block; margin-bottom: 5px;">Invoice From</strong>
                      <div style="font-weight: bold; margin-bottom: 4px;">PetsyHub</div>
                      <div>PetsyHub Headquarters</div>
                      <div>+971 55 123 4567</div>
                      <div>support@petsyhub.com</div>
                      <p style="font-size: 12px; color: #999; margin-top: 10px;">
                        Products provided by: ${shop.name}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Product Table -->
            <tr>
              <td style="padding: 20px;">
                <table width="100%" cellpadding="8" cellspacing="0"
                  style="border-collapse: collapse; font-size: 14px; color: #333;">
                  <thead>
                    <tr style="background: #f5f5f5; text-align: left;">
                      <th style="border-bottom: 1px solid #ddd;">Product / Service</th>
                      <th style="border-bottom: 1px solid #ddd;">SKU</th>
                      <th style="text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                      <th style="text-align: right; border-bottom: 1px solid #ddd;">Qty</th>
                      <th style="text-align: right; border-bottom: 1px solid #ddd;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    <!-- Subtotal -->
                    <tr style="border-top: 2px solid #ddd;">
                      <td colspan="4" style="text-align: right;">Subtotal</td>
                      <td style="text-align: right;">${order.amountSubTotal}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right;">Shipping Fees</td>
                      <td style="text-align: right;">${order.shippingFee}</td>
                    </tr>

                    <!-- Total -->
                    <tr style="background: #f5f5f5; font-weight: bold;">
                      <td colspan="4" style="text-align: right; font-size: 16px;">TOTAL AMOUNT :</td>
                      <td style="text-align: right; font-size: 16px;">${order.amountTotal} ${order.currency}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};
