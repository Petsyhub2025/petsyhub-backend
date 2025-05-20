import { petsyTemplate } from './petsy.template';

export const serviceProviderOrderPlacedTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p>You’ve received a <strong>new order</strong> on <strong>PetsyHub</strong> to your ${shopName} branch! 📦</p>
      <p><strong>Order</strong> ${orderId}</p>
      <p>Check your dashboard to view your new order.</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders" 
           style="background-color:#f78903; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Orders on Dashboard
        </a>
      </div>
  
      <p>Prompt action leads to happy customers! 🚚</p>
    `;
  return petsyTemplate(name, content);
};
