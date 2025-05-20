import { petsyTemplate } from './petsy.template';

export const loginSuccessTemplate = (name: string): string => {
  const content = `
    <p>You have successfully logged into your PetsyHub account.</p>
    <p>If this wasn't you, we recommend changing your password immediately to keep your account secure.</p>
    <p>Welcome back and happy browsing! 🐾</p>
  `;
  return petsyTemplate(name, content);
};
