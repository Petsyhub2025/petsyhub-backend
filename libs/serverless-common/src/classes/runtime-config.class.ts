import { MediaTypeEnum } from '@common/schemas/mongoose/common/media/media.enum';
import { ResourceModelDto } from '@serverless/common/classes/validations/resource-model.class';

interface IRuntimeConfig {
  isUploadedByAdmin: boolean;
  filesS3PathPrefix: string;
  resourceModel: ResourceModelDto;
  allowedMediaTypes: MediaTypeEnum[];
  multiMediaAspectRatio: number | null; // This is used to validate that after the 1st media processed, any subsequent media has the same aspect ratio
}

export class RuntimeConfig {
  private static _config: IRuntimeConfig = {} as IRuntimeConfig;

  public static get config() {
    return this._config;
  }

  public static set(config: Partial<IRuntimeConfig>) {
    this._config = {
      ...this._config,
      ...config,
    };
  }
}
