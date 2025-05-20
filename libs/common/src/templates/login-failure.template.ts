import { petsyTemplate } from './petsy.template';

export const loginFailureTemplate = (name: string): string => {
  const content = `
    <p>We noticed a failed login attempt to your PetsyHub account.</p>
    <p>Please check your credentials and try again. If you forgot your password, you can easily reset it from the login page.</p>
    <p>If you didn't try to log in, we recommend updating your password as a precaution.</p>
  `;
  return petsyTemplate(name, content);
};
