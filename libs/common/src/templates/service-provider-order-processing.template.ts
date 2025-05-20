import { petsyTemplate } from './petsy.template';

export const serviceProviderOrderProcessingTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p><strong>Order #${orderId}</strong> from your ${shopName} branch is now marked as <strong>processing</strong>. ⚙️</p>
      <p>Please make sure everything is being prepared accurately and promptly.</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders?limit=10&page=1&status=PROCESSING" 
           style="background-color:#007bff; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Processing Orders
        </a>
      </div>
    `;
  return petsyTemplate(name, content);
};
