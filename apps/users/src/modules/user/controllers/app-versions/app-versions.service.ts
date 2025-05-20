import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  IAndroidVersionModel,
  IBaseVersionModel,
  IIosVersionModel,
  ModelNames,
  VersionType,
} from '@instapets-backend/common';
import { errorManager } from '@users/user/shared/config/errors.config';
import { GetAppVersionQueryDto } from './dto/get-app-version.dto';

@Injectable()
export class AppVersionsService {
  constructor(
    @Inject(ModelNames.BASE_APP_VERSION) private readonly baseVersionModel: IBaseVersionModel,
    @Inject(ModelNames.ANDROID_APP_VERSION) private readonly androidVersionModel: IAndroidVersionModel,
    @Inject(ModelNames.IOS_APP_VERSION) private readonly iosVersionModel: IIosVersionModel,
  ) {}

  async getAppVersion({ platform, version }: GetAppVersionQueryDto) {
    const versionParts = this.processVersion(version);
    const response = {
      shouldUpdate: true,
      backendVersions: null,
    };
    switch (platform) {
      case VersionType.ANDROID:
        const androidVersion = await this.androidVersionModel
          .findOne({
            $and: [
              {
                $or: [
                  { 'androidVersion.min.major': { $lt: versionParts.major } },
                  {
                    'androidVersion.min.major': versionParts.major,
                    'androidVersion.min.minor': { $lt: versionParts.minor },
                  },
                  {
                    'androidVersion.min.major': versionParts.major,
                    'androidVersion.min.minor': versionParts.minor,
                    'androidVersion.min.patch': { $lte: versionParts.patch },
                  },
                ],
              },
              {
                $or: [
                  { 'androidVersion.max.major': { $gt: versionParts.major } },
                  {
                    'androidVersion.max.major': versionParts.major,
                    'androidVersion.max.minor': { $gt: versionParts.minor },
                  },
                  {
                    'androidVersion.max.major': versionParts.major,
                    'androidVersion.max.minor': versionParts.minor,
                    'androidVersion.max.patch': { $gte: versionParts.patch },
                  },
                ],
              },
            ],
          })
          .sort({ _id: -1 });
        response.shouldUpdate = androidVersion?.isDeprecated;
        response.backendVersions = androidVersion?.backendVersions;
        break;
      case VersionType.IOS:
        const iosVersion = await this.iosVersionModel
          .findOne({
            $and: [
              {
                $or: [
                  { 'iosVersion.min.major': { $lt: versionParts.major } },
                  { 'iosVersion.min.major': versionParts.major, 'iosVersion.min.minor': { $lt: versionParts.minor } },
                  {
                    'iosVersion.min.major': versionParts.major,
                    'iosVersion.min.minor': versionParts.minor,
                    'iosVersion.min.patch': { $lte: versionParts.patch },
                  },
                ],
              },
              {
                $or: [
                  { 'iosVersion.max.major': { $gt: versionParts.major } },
                  { 'iosVersion.max.major': versionParts.major, 'iosVersion.max.minor': { $gt: versionParts.minor } },
                  {
                    'iosVersion.max.major': versionParts.major,
                    'iosVersion.max.minor': versionParts.minor,
                    'iosVersion.max.patch': { $gte: versionParts.patch },
                  },
                ],
              },
            ],
          })
          .sort({ _id: -1 });
        response.shouldUpdate = iosVersion?.isDeprecated;
        response.backendVersions = iosVersion?.backendVersions;
        break;
      default:
        throw new BadRequestException(errorManager.WRONG_VERSION_TYPE);
    }
    return {
      ...response,
      shouldUpdate: response.shouldUpdate ?? true,
    };
  }

  private processVersion(version: string) {
    const versionParts = version.split('.');
    const major = +versionParts[0];
    const minor = +versionParts[1] || 0;
    const patch = +versionParts[2] || 0;
    return {
      major,
      minor,
      patch,
    };
  }
}
