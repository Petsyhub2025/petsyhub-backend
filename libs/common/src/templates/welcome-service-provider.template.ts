// templates/service-provider-welcome.template.ts
import { petsyTemplate } from './petsy.template';

export const serviceProviderWelcomeTemplate = (name: string): string => {
  const content = `
    <p>Welcome to <strong>PetsyHub</strong>, ${name}! 🐾</p>

    <p>You're now part of a thriving platform where pet lovers connect with trusted businesses — whether you're running a <strong>pet shop</strong>, a <strong>clinic</strong>, or both!</p>

    <p><strong>Let’s get your business ready to grow!</strong> Head to your dashboard and complete these essential setup steps:</p>

    <ul style="margin: 16px 0; padding-left: 20px;">
      <li>📝 Upload your business documents for verification</li>
      <li>🏪 Set up your shop or clinic profile, schedule, and availability</li>
      <li>👥 For clinics: Add your veterinary staff and their specializations</li>
      <li>📦 Add the products or services you offer</li>
      <li>💰 Start receiving bookings and orders to grow your revenue</li>
    </ul>

    <p style="text-align: center;"><strong>Head to your dashboard to complete your setup now:</strong></p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://business.petsyhub.com/app/dashboard" 
         style="background-color:#f78903; color:#fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>

    <p>Need help? Our onboarding team is ready to support you at every step.</p>
    <p>We're excited to see your success on PetsyHub!</p>
  `;
  return petsyTemplate(name, content);
};
