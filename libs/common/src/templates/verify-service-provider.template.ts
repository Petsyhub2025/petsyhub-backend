import { petsyTemplate } from './petsy.template';

export const verifyServiceProviderTemplate = (name: string, token: string): string => {
  const link = `https://business.petsyhub.com/auth/email-verification?accessToken=${token}`;
  const content = `
    <p>Welcome to <strong>PetsyHub</strong>!</p>
    <p>To complete your registration as a service provider, please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${link}" style="background-color:#f78903; color:#fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Verify My Email
      </a>
    </div>
    <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
    <p style="word-break: break-all;">${link}</p>
    <p>We're excited to have you onboard!</p>
  `;
  return petsyTemplate(name, content);
};
