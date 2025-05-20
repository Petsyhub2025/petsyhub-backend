import { petsyTemplate } from './petsy.template';

export const orderPaymentSuccessTemplate = (name: string, generatedUniqueId: string): string => {
  const content = `
    <p>Your payment for order #${generatedUniqueId} has been successfully received. ✅</p>
    <p>Your items will soon be prepared and shipped.</p>
    <p>Thank you for trusting PetsyHub for your pet’s needs!</p>
  `;
  return petsyTemplate(name, content);
};
