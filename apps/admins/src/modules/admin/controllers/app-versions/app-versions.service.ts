import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  AppVersion,
  BaseVersion,
  BaseVersionSubSchemaType,
  IAndroidVersionModel,
  IBaseVersionModel,
  IIosVersionModel,
  ModelNames,
  ResponsePayload,
  VersionSubSchemaType,
  VersionType,
  addPaginationStages,
} from '@instapets-backend/common';
import { CreateVersionDto, CreateVersionQueryDto } from './dto/create-version.dto';
import { errorManager } from '../../shared/config/errors.config';
import { Types } from 'mongoose';
import { VersionIdParamDto } from '../../shared/dto/version-id-param.dto';
import { GetVersionsQueryDto } from './dto/get-versions.dto';
import { getAppVersionsPipeline } from './helpers/app-versions-pipeline.helper';

@Injectable()
export class AppVersionsService {
  constructor(
    @Inject(ModelNames.BASE_APP_VERSION) private baseVersionModel: IBaseVersionModel,
    @Inject(ModelNames.ANDROID_APP_VERSION) private androidVersionModel: IAndroidVersionModel,
    @Inject(ModelNames.IOS_APP_VERSION) private iosVersionModel: IIosVersionModel,
  ) {}

  async getAppVersions(adminId: string, query: GetVersionsQueryDto): Promise<ResponsePayload<BaseVersion>> {
    const { page, limit, platform } = query;
    const matchStage = [
      {
        $match: {
          versionType: platform,
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.baseVersionModel.aggregate(matchStage).count('total'),
      this.baseVersionModel.aggregate([
        ...matchStage,
        {
          $sort: {
            _id: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        ...getAppVersionsPipeline(),
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async createVersion(adminId: string, { platform }: CreateVersionQueryDto, body: CreateVersionDto) {
    const versionPayload = this.createVersionPayload(body.minVersion, body.maxVersion);
    const previousVersion = await this.getPreviousVersion();
    switch (platform) {
      case VersionType.ANDROID:
        if (
          previousVersion &&
          previousVersion.versionType === VersionType.ANDROID &&
          !this.validateVersion(previousVersion.androidVersion.max, versionPayload.min)
        ) {
          throw new BadRequestException(errorManager.WRONG_VERSION_RANGE);
        }
        const androidVersion = new this.androidVersionModel({
          ...body,
          androidVersion: versionPayload,
        });
        await androidVersion.save();
        return androidVersion;
      case VersionType.IOS:
        if (
          previousVersion &&
          previousVersion.versionType === VersionType.IOS &&
          !this.validateVersion(previousVersion.iosVersion.max, versionPayload.min)
        ) {
          throw new BadRequestException(errorManager.WRONG_VERSION_RANGE);
        }
        const iosVersion = new this.iosVersionModel({
          ...body,
          iosVersion: versionPayload,
        });
        await iosVersion.save();
        return iosVersion;
      default:
        throw new BadRequestException(errorManager.WRONG_VERSION_TYPE);
    }
  }

  async deprecateVersion(adminId: string, { versionId }: VersionIdParamDto) {
    const version = await this.assertVersionAndRetrieve(versionId);
    if (version.isDeprecated) {
      throw new ConflictException(errorManager.VERSION_ALREADY_DEPRECATED);
    }
    switch (version.versionType) {
      case VersionType.ANDROID:
        const androidVersion = await this.androidVersionModel.findById(versionId);
        androidVersion.set({
          isDeprecated: true,
        });
        await androidVersion.save();
        return androidVersion;
      case VersionType.IOS:
        const iosVersion = await this.iosVersionModel.findById(versionId);
        iosVersion.set({
          isDeprecated: true,
        });
        await iosVersion.save();
        return iosVersion;
      default:
        throw new BadRequestException(errorManager.WRONG_VERSION_TYPE);
    }
  }

  async deleteVersion(adminId: string, { versionId }: VersionIdParamDto) {
    const version = await this.assertVersionAndRetrieve(versionId);
    switch (version.versionType) {
      case VersionType.ANDROID:
        const androidVersion = await this.androidVersionModel.findById(versionId);
        await androidVersion.deleteDoc();
        return androidVersion;
      case VersionType.IOS:
        const iosVersion = await this.iosVersionModel.findById(versionId);
        await iosVersion.deleteDoc();
        return iosVersion;
      default:
        throw new BadRequestException(errorManager.WRONG_VERSION_TYPE);
    }
  }

  private validateVersion(minVersion: VersionSubSchemaType, maxVersion: VersionSubSchemaType): boolean {
    if (maxVersion.major < minVersion.major) {
      return false;
    }
    if (maxVersion.major === minVersion.major && maxVersion.minor < minVersion.minor) {
      return false;
    }
    if (
      maxVersion.major === minVersion.major &&
      maxVersion.minor === minVersion.minor &&
      maxVersion.patch < minVersion.patch
    ) {
      return false;
    }
    return true;
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

  private createVersionPayload(minVersion: string, maxVersion: string): BaseVersionSubSchemaType {
    const versionPayload: BaseVersionSubSchemaType = {
      min: this.processVersion(minVersion),
      max: this.processVersion(maxVersion),
    };

    if (!this.validateVersion(versionPayload.min, versionPayload.max)) {
      throw new BadRequestException(errorManager.WRONG_VERSION_RANGE);
    }
    return versionPayload;
  }

  private async getPreviousVersion(): Promise<AppVersion | undefined> {
    const [version] = await this.baseVersionModel.aggregate([
      {
        $match: {},
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 1,
          androidVersion: 1,
          iosVersion: 1,
          versionType: 1,
        },
      },
    ]);
    return version;
  }

  private async assertVersionAndRetrieve(versionId: string): Promise<AppVersion> {
    const [version] = await this.baseVersionModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(versionId),
        },
      },
      {
        $project: {
          _id: 1,
          versionType: 1,
          androidVersion: 1,
          iosVersion: 1,
          isDeprecated: 1,
        },
      },
    ]);
    if (!version) {
      throw new BadRequestException(errorManager.VERSION_NOT_FOUND);
    }
    return version;
  }
}
