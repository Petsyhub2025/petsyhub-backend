import { API_VERSION_GUARD_METADATA_KEY } from '@common/constants';
import { SetMetadata } from '@nestjs/common';

export const NoApiVersion = () => SetMetadata(API_VERSION_GUARD_METADATA_KEY, true);
