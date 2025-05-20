import { petsyTemplate } from './petsy.template';

export const serviceProviderPaymentSuccessTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p>Great news! Payment for <strong>Order #${orderId}</strong> from your ${shopName} branch has been <strong>successfully processed</strong>. 💳</p>
      <p>You can now proceed with fulfilling the order.</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders" 
           style="background-color:#28a745; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Manage Order on Dashboard
        </a>
      </div>
  
      <p>Thank you for being a valued provider on PetsyHub!</p>
    `;
  return petsyTemplate(name, content);
};
