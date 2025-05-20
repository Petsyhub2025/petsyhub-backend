import { BaseSearchPaginationQuery } from '@common/dtos';
import { ShareableDeepLinkModelsEnum } from '@common/enums';

export class DynamicLinksAdminRpcPayload extends BaseSearchPaginationQuery {
  type?: ShareableDeepLinkModelsEnum[];
  isArchived?: boolean;
}
