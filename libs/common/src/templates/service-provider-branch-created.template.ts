// templates/service-provider-shop-submitted.template.ts
import { petsyTemplate } from './petsy.template';

export const serviceProviderBranchSubmittedTemplate = (name: string, shopName: string): string => {
  const content = `
    <p>🎉 Great job! You’ve successfully completed setup for your ${shopName} shop and submitted it for review.</p>

    <p>Our team is currently reviewing your submission to ensure everything meets PetsyHub’s quality standards.</p>

    <p><strong>What’s next?</strong></p>
    <ul style="margin: 16px 0; padding-left: 20px;">
      <li>🔎 We’ll verify your documents and business details</li>
      <li>⏳ Approvals typically take up to one week from date of submission</li>
      <li>📢 Once approved, your shop will be visible to thousands of pet lovers</li>
    </ul>

    <p>You’ll receive an email to notify you as soon as your shop is approved.</p>

    <p>Thanks for joining the PetsyHub family — we’re excited to have you with us!</p>
  `;
  return petsyTemplate(name, content);
};
