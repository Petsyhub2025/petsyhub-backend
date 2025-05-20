import * as jwt from 'jsonwebtoken';

export enum AppleAuthenticationUserDetectionStatus {
  /**
   * The system does not support this determination and there is no data.
   */
  UNSUPPORTED = 0,
  /**
   * The system has not determined whether the user might be a real person.
   */
  UNKNOWN = 1,
  /**
   * The user appears to be a real person.
   */
  LIKELY_REAL = 2,
}

export interface IAppleJWTPayload extends jwt.JwtPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  nonce: string;
  nonce_supported: boolean;
  email: string;
  email_verified: string | boolean;
  is_private_email: string | boolean;
  real_user_status: AppleAuthenticationUserDetectionStatus;
  transfer_sub: string;
}

export interface IAppleAuthKey {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

export interface IAppleAuthKeysResponse {
  keys: IAppleAuthKey[];
}

export type JwtHeaderWithKid = jwt.JwtHeader & { kid: string };
