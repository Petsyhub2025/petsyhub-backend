import { petsyTemplate } from './petsy.template';

export const resetPasswordTemplate = (name: string, token: string): string => {
  const link = `https://business.petsyhub.com/auth/reset-password?accessToken=${token}`;
  const content = `
    <p>You requested to reset your <strong>PetsyHub</strong> account password.</p>
    <p>Click the button below to securely reset your password:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${link}" style="background-color:#f78903; color:#fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">${link}</p>
    <p>This link will expire in 30 minutes for security reasons.</p>
    <p>If you didn’t request a password reset, you can safely ignore this email.</p>
  `;
  return petsyTemplate(name, content);
};
