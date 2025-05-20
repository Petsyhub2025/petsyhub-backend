import { petsyTemplate } from './petsy.template';

export const serviceProviderOrderDeliveredTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p><strong>Order #${orderId}</strong> from your ${shopName} branch has been <strong>delivered successfully</strong> to the customer. 📦✅</p>
      <p>Thank you for fulfilling it with care!</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders?limit=10&page=1&status=DELIVERED" 
           style="background-color:#28a745; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Review Delivered Orders
        </a>
      </div>
    `;
  return petsyTemplate(name, content);
};
