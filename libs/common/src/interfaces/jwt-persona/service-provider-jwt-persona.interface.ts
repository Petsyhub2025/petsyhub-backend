export interface ServiceProviderJwtPersona {
  _id: string;
  fullName: string;
  email: string;
  brandMembership: any;
  sessionId: string;
  iat: number;
  exp: number;
}
