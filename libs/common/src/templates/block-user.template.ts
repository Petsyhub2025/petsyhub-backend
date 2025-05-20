import { petsyTemplate } from './petsy.template';

export const accountBlockedTemplate = (name: string, blockUntil: Date): string => {
  const content = `
    <p>We're writing to inform you that your account on <strong>Petsy</strong> has been <span style="color: #d00000; font-weight: bold;">blocked</span> due to misconduct.</p>
    <p>This block will remain in effect until: <strong>${blockUntil.toDateString()}</strong></p>
    <p>If you have questions or would like to appeal this action, please contact our support team.</p>
  `;
  return petsyTemplate(name, content);
};
