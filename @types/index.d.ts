import { HydratedDocument } from 'mongoose';
import {
  AdminJwtPersona,
  CustomerJwtPersona,
  ServiceProviderJwtPersona,
  UserJwtPersona,
} from '../libs/common/src/interfaces/jwt-persona/index';
import { IProcessEnv } from '../libs/common/src/interfaces/env';

declare global {
  type Hydrate<T> = HydratedDocument<T>;

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      persona?: UserJwtPersona | AdminJwtPersona | ServiceProviderJwtPersona | CustomerJwtPersona;
    }
  }

  namespace NodeJS {
    interface ProcessEnv extends IProcessEnv {}
  }
}
