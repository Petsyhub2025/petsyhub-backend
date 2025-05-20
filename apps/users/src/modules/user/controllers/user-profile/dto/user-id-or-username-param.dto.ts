import { IsAlphanumeric } from 'class-validator';

export class UserIdOrUsernameParamDto {
  @IsAlphanumeric()
  userIdOrUsername: string;
}
