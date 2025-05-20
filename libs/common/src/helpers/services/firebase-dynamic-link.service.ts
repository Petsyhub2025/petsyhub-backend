import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { HydratedDocument } from 'mongoose';
import { DeepLinkService } from './deep-link.service';
import { IFireBaseDynamicLinkOptions } from '@common/interfaces/firebase-dynamic-link';
import { CustomLoggerService } from '@common/modules/common/services/logger';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { BaseModel } from '@common/schemas/mongoose/base/base-schema';

@Injectable()
export class FirebaseDynamicLinkService {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly deepLinkService: DeepLinkService,
    private readonly logger: CustomLoggerService,
  ) {}

  async generateFirebaseDynamicLink<T extends BaseModel>(
    doc: HydratedDocument<T>,
    fieldsToCheck: (keyof T)[],
    { link, description, imageUrl, title }: IFireBaseDynamicLinkOptions,
  ) {
    if (!this.shouldModifyDynamicLink(doc, fieldsToCheck)) {
      return doc.dynamicLink;
    }

    const apiUrl = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${this.appConfig.FIREBASE_USER_API_KEY}`;

    try {
      const payload = {
        dynamicLinkInfo: {
          domainUriPrefix: this.appConfig.FIREBASE_USER_DYNAMIC_LINKS_DOMAIN,
          link: link ?? this.deepLinkService.getDefaultUserDeepLink(),
          androidInfo: {
            androidPackageName: this.appConfig.USER_APP_ANDROID_PACKAGE_NAME,
          },
          iosInfo: {
            iosBundleId: this.appConfig.USER_APP_IOS_PACKAGE_NAME,
          },
          socialMetaTagInfo: {
            socialTitle: title ?? this.appConfig.USER_APP_NAME,
            socialDescription: description ?? this.appConfig.USER_APP_DESCRIPTION,
            socialImageLink: imageUrl ?? this.appConfig.USER_APP_LOGO,
          },
        },
        suffix: {
          option: 'SHORT',
        },
      };

      const response = await axios.post(apiUrl, payload, {
        timeout: 5000,
        headers: {
          'Accept-Encoding': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const { shortLink } = response.data;

      if (!shortLink) {
        this.logger.error(`Error generating dynamic link for ${doc.collection.collectionName} ${link}.`, {
          response,
        });
        throw new Error('Error generating dynamic link, no short link returned.');
      }

      return shortLink;
    } catch (error) {
      this.logger.error(`Error generating dynamic link for ${doc.collection.collectionName} ${link}.`, {
        error,
      });

      return this.getDefaultFirebaseDynamicLink();
    }
  }

  getDefaultFirebaseDynamicLink() {
    return this.appConfig.FIREBASE_USER_DEFAULT_DYNAMIC_LINK;
  }

  private shouldModifyDynamicLink<T extends BaseModel>(doc: HydratedDocument<T>, fieldsToCheck: (keyof T)[]) {
    const areCheckedFieldsModified = fieldsToCheck.some((field) => doc.isModified(field as string));
    const isDefaultDynamicLink = doc.dynamicLink === this.getDefaultFirebaseDynamicLink();
    const isUndefinedOrNullDynamicLink = doc.dynamicLink == null;

    return doc.isNew || isUndefinedOrNullDynamicLink || areCheckedFieldsModified || isDefaultDynamicLink;
  }
}
