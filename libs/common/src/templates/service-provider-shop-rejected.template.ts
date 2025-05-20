// templates/service-provider-shop-rejected.template.ts
import { petsyTemplate } from './petsy.template';

export const serviceProviderShopRejectedTemplate = (name: string, shopName: string, reason?: string): string => {
  const reasonBlock = reason
    ? `
    <div style="background: #ffecec; padding: 12px; border-left: 4px solid #f44336; margin: 16px 0;">
      <h3 style="margin: 0 0 8px; font-size: 18px; color: #f44336;">Rejection Reason:</h3>
      <p style="margin: 0;">${reason}</p>
    </div>
  `
    : '';

  const content = `
    <p>We’ve reviewed your ${shopName} branch submission on <strong>PetsyHub</strong>, and unfortunately, it was <strong>not approved</strong> at this time.</p>

    ${reasonBlock}

    <p>You’re welcome to revise and resubmit your application after making the necessary changes.</p>

    <p><strong>Common rejection reasons include:</strong></p>
    <ul style="margin: 16px 0; padding-left: 20px;">
      <li>❌ Incomplete or inaccurate business details</li>
      <li>📄 Missing or unclear documents</li>
      <li>🕒 Invalid working hours or service info</li>
    </ul>

    <p>If you believe this was a mistake or need clarification, feel free to reach out to our support team.</p>
    <p>We’re here to help you succeed on PetsyHub.</p>
  `;
  return petsyTemplate(name, content);
};
