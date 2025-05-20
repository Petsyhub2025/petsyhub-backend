import { petsyTemplate } from './petsy.template';

export const accountSuspendedTemplate = (name: string): string => {
  const content = `
    <p>We're writing to inform you that your account on <strong>PetsyHub</strong> has been <span style="color: #e76f51; font-weight: bold;">suspended</span> due to misconduct.</p>
    <p>This action is temporary and will remain in place until further notice. If you believe this was a mistake or want to appeal, please contact our support team.</p>
    <p>Thank you for your understanding.</p>
  `;
  return petsyTemplate(name, content);
};
