import { petsyTemplate } from './petsy.template';

export const orderOutForDeliveryTemplate = (name: string, generatedUniqueId: string): string => {
  const content = `
    <p>Your order #${generatedUniqueId} is now out for delivery! 🚚</p>
    <p>It will arrive at your doorstep soon. Make sure someone is available to receive it!</p>
    <p>Thank you for shopping with PetsyHub!</p>
  `;
  return petsyTemplate(name, content);
};
