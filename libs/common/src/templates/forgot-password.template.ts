import { petsyTemplate } from './petsy.template';

export const forgotPasswordTemplate = (name: string, code: string): string => {
  const content = `
    <p>We received a request to reset the password associated with this email address.</p>
    <p>Please use the One-Time Password (OTP) below to verify your identity and continue:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 28px; font-weight: bold; color: #f78903;">${code}</span>
    </div>
    <p>This code will expire in 10 minutes for your security.</p>
    <p>If you didn't request this, please ignore this email or contact our support.</p>
  `;
  return petsyTemplate(name, content);
};
