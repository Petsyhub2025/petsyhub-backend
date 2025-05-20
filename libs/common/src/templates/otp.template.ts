import { petsyTemplate } from './petsy.template';

export const otpTemplate = (name: string, code: string): string => {
  const content = `<p>Your OTP is: <strong>${code}</strong></p>
                   <p>This code is valid for 10 minutes.</p>`;
  return petsyTemplate(name, content);
};
