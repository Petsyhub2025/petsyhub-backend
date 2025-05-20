import { petsyTemplate } from './petsy.template';

export const customerWelcomeTemplate = (name: string): string => {
  const content = `
    <p>Thank you for joining <strong>PetsyHub</strong>!</p>
    <p>We're excited to have you on board. Explore amazing products and services specially crafted for your beloved pets.</p>
    <p>🐶🐱🦜 Let's make every moment with your pets even more special!</p>
  `;
  return petsyTemplate(name, content);
};
