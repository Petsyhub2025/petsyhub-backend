import jwt from 'jsonwebtoken';

export function signS2SToken() {
  if (!process.env.S2S_JWT_SECRET) {
    throw new Error('S2S_JWT_SECRET is not defined');
  }

  return jwt.sign({}, process.env.S2S_JWT_SECRET!, {
    expiresIn: 60,
  });
}
