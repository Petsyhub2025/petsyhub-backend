// templates/service-provider-shop-approved.template.ts
import { petsyTemplate } from './petsy.template';

export const serviceProviderShopApprovedTemplate = (name: string, shopName: string): string => {
  const content = `
    <p>🎉 Great news — your ${shopName} branch has been <strong>approved</strong> and is now live on <strong>PetsyHub</strong>!</p>

    <p>Now it's time to get your inventory ready so customers can start shopping.</p>

    <p><strong>Here's what to do next:</strong></p>
    <ul style="margin: 16px 0; padding-left: 20px;">
      <li>📦 <strong>Add your products or services</strong> — the sooner, the better</li>
      <li>🗓️ Set your availability and delivery preferences</li>
      <li>🛠️ Keep your shop profile engaging and up to date</li>
    </ul>

    <p>The faster you set up, the sooner customers can start placing orders with you!</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://business.petsyhub.com/app/E-commerce-Management/inventory-managment?limit=10&page=1" 
         style="background-color:#28a745; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        <Manage Inventory Now>
      </a>
    </div>

    <p>Welcome to PetsyHub — let’s help your business thrive. 🐾</p>
  `;
  return petsyTemplate(name, content);
};
