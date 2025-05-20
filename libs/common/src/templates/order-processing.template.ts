import { petsyTemplate } from './petsy.template';

export const orderProcessingTemplate = (name: string, generatedUniqueId: string): string => {
  const content = `
    <p>📦 Your order <strong>#${generatedUniqueId}</strong> is now being processed!</p>
    <p>🐶 Our team is preparing your items with care to get them ready for shipping.</p>
    <p>🚚 We'll let you know once it’s out for delivery.</p>
    <p>Thank you for shopping with <strong>Petsy Hub</strong> 🐾</p>
  `;
  return petsyTemplate(name, content);
};
