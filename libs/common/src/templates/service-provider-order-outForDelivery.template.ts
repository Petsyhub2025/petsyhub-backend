import { petsyTemplate } from './petsy.template';

export const serviceProviderOrderOutForDeliveryTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p><strong>Order #${orderId}</strong> from your ${shopName} branch is now <strong>out for delivery</strong>. 🚚</p>
      <p>Please monitor the delivery status and ensure timely hand-off to the customer.</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders?limit=10&page=1&status=OUT_FOR_DELIVERY" 
           style="background-color:#ffc107; color:#000; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Track Deliveries
        </a>
      </div>
    `;
  return petsyTemplate(name, content);
};
