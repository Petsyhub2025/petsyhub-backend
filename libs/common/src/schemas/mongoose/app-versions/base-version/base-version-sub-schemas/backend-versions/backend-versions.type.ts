import { IsNumberString } from 'class-validator';

export class BackEndVersionsSubSchemaType {
  @IsNumberString()
  users: string;

  @IsNumberString()
  authentication: string;

  @IsNumberString()
  pets: string;

  @IsNumberString()
  posts: string;

  @IsNumberString()
  engagement: string;

  @IsNumberString()
  admins: string;

  @IsNumberString()
  areas: string;

  @IsNumberString()
  feed: string;

  @IsNumberString()
  discovery: string;

  @IsNumberString()
  search: string;

  @IsNumberString()
  notifications: string;

  @IsNumberString()
  moderation: string;

  @IsNumberString()
  chat: string;

  @IsNumberString()
  serviceproviders: string;

  @IsNumberString()
  events: string;

  @IsNumberString()
  topics: string;
}
