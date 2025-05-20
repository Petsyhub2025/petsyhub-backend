import { RelationTypesEnum } from '@instapets-backend/common';

export const MAX_FEED_UPSERT_RETRIES = 3;
export const MAX_FEED_UPSERT_RETRIES_INTERVAL = 1000;

export const includedUserRelations = [
  RelationTypesEnum.POSTED,
  RelationTypesEnum.COMMENTED_ON,
  RelationTypesEnum.REPLIED_TO_COMMENT_ON,
]
  .map((s) => `'${s}'`)
  .join(',');
