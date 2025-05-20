import { petsyTemplate } from './petsy.template';

export const orderDeliveredTemplate = (name: string, generatedUniqueId: string): string => {
  const content = `
    <p>Good news! Your order #${generatedUniqueId} has been delivered successfully. 🎁</p>
    <p>We hope you and your pet enjoy your new items!</p>
    <p>Thank you for being part of the Petsy family. 🐶🐾</p>
  `;
  return petsyTemplate(name, content);
};
