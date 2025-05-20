import { petsyTemplate } from './petsy.template';

export const serviceProviderOrderScheduledTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p><strong>Order #${orderId}</strong> from your ${shopName}branch has been <strong>scheduled</strong> successfully. 🗓️</p>
      <p>Please ensure your team is prepared in advance to fulfill it at the designated time.</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders?limit=10&page=1&status=SCHEDULED" 
           style="background-color:#17a2b8; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Scheduled Orders
        </a>
      </div>
    `;
  return petsyTemplate(name, content);
};
