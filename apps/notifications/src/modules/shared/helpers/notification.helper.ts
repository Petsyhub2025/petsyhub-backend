import { User } from '@instapets-backend/common';
import { HydratedDocument } from 'mongoose';

export function getAuthorFromAuthorUsers(authorUsers: HydratedDocument<User>[]): string {
  return authorUsers
    .map(({ firstName, lastName }, index) => {
      const isLast = index === authorUsers.length - 1;
      const isBeforeLast = index === authorUsers.length - 2;

      const delimiter = !isLast ? (isBeforeLast ? ' and ' : ', ') : '';

      return `${firstName} ${lastName}${delimiter}`;
    })
    .join('');
}

export function processNotificationBody(body: string, author: string) {
  return body.replace(/@author/g, author);
}

export function processNotificationDeepLink(deepLink: string) {
  const regex = /authorUser=([a-zA-z0-9]+)/g;

  const matches = deepLink.match(regex);

  if (!matches) return [];

  const authorUserIds = matches.map((match) => match.replace(regex, '$1'));

  return authorUserIds;
}
