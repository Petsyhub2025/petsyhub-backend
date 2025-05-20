export interface UserJwtPersona {
  _id: string;
  username: string;
  sessionId: string;
  iat: number;
  exp: number;
}
