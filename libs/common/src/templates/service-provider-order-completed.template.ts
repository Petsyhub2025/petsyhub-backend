import { petsyTemplate } from './petsy.template';

export const serviceProviderOrderCompletedTemplate = (name: string, orderId: string, shopName: string): string => {
  const content = `
      <p><strong>Order #${orderId}</strong> from your ${shopName} branch has been <strong>successfully completed</strong>. 🎉</p>
      <p>The transaction is now closed and visible in your earnings dashboard.</p>
  
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://business.petsyhub.com/app/orders?limit=10&page=1&status=COMPLETED" 
           style="background-color:#6f42c1; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Completed Orders
        </a>
      </div>
    `;
  return petsyTemplate(name, content);
};
