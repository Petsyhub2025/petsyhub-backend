import { JWT_GUARD_METADATA_KEY } from '@common/constants';
import { SetMetadata } from '@nestjs/common';

export const IsPrivateAuthOrPublic = () => SetMetadata(JWT_GUARD_METADATA_KEY, true);
