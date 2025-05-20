import { UniquePrefixEnum } from '@common/enums';
import { DiscordSnowflake } from '@sapphire/snowflake';

export function generateUniqueIdFromPrefix(prefix: UniquePrefixEnum) {
  const now = new Date();
  const timestamp = now.toISOString().slice(2, 10).replace(/[-T:]/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + timestamp + randomPart;
}
