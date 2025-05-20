import { petsyTemplate } from './petsy.template';

export const passwordChangedTemplate = (name: string): string => {
  const content = `
    <p>This is a confirmation that your PetsyHub account password has been updated successfully.</p>
    <p>If you didn't request this change, please contact our support team immediately for assistance.</p>
    <p>Thank you for helping us keep your account safe! 🛡️</p>
  `;
  return petsyTemplate(name, content);
};
