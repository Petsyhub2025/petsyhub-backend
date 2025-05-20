import { Injectable } from '@nestjs/common';
import { TrieService } from './trie.service';
import {
  IUserDeepLinkOptions,
  IAdminDeepLinkOptions,
  IServiceProviderDeepLinkOptions,
} from '@common/interfaces/deep-link';
import { CustomLoggerService } from '@common/modules/common/services/logger';
import { AppConfig } from '@common/modules/env-config/services/app-config';

@Injectable()
export class DeepLinkService {
  private deepLinkPaths = {
    posts: [
      ['posts'],
      ['posts', ':postId'],
      ['posts', ':postId', 'comments', ':commentId'],
      ['posts', ':postId', 'comments', ':commentId', 'replies', ':replyId'],
    ],
    users: [['users'], ['users', '#username']],
    pets: [['pets'], ['pets', ':petId']],
    appointments: [['appointments'], ['appointments', ':appointmentId']],
    lostPosts: [['lost-posts'], ['lost-posts', ':lostPostId']],
    foundPosts: [['found-posts'], ['found-posts', ':foundPostId']],
    events: [['events'], ['events', ':eventId']],
  };

  constructor(
    private readonly appConfig: AppConfig,
    private readonly logger: CustomLoggerService,
    private readonly trie: TrieService,
  ) {
    this.constructTrie();
  }

  generateUserDeepLink(options: IUserDeepLinkOptions) {
    const { modelName, modelId, modelInteractions, queryParams } = options;

    let deepLink = `${this.appConfig.FIREBASE_USER_DEEP_LINKS_DOMAIN}/${modelName}/${modelId}`;

    modelInteractions?.forEach(({ interaction, interactionId }) => {
      deepLink += `/${interaction}/${interactionId}`;
    });

    if (!this.validateUserDeepLink(deepLink)) {
      this.logger.error(`Invalid user deep link generated: ${deepLink}`, {
        modelName,
        modelId,
        ...(modelInteractions && { modelInteractions }),
      });
      return this.getDefaultUserDeepLink();
    }

    return this.addQueryParamsToDeepLink(deepLink, queryParams);
  }

  generateAdminDeepLink(options: IAdminDeepLinkOptions) {
    const { modelName, modelId, subModels, queryParams } = options;

    let deepLink = `${this.appConfig.FIREBASE_ADMIN_DEEP_LINKS_DOMAIN}/${modelName}/${modelId}`;

    subModels?.forEach(({ subModelName, subModelId }) => {
      deepLink += `/${subModelName}/${subModelId}`;
    });

    if (!this.validateAdminDeepLink(deepLink)) {
      this.logger.error(`Invalid admin deep link generated: ${deepLink}`, {
        modelName,
        modelId,
        ...(subModels && { subModels }),
      });
      return this.getDefaultAdminDeepLink();
    }

    return this.addQueryParamsToDeepLink(deepLink, queryParams);
  }

  generateServiceProviderDeepLink(options: IServiceProviderDeepLinkOptions) {
    const { modelName, modelId, queryParams } = options;

    const deepLink = `${this.appConfig.FIREBASE_SERVICE_PROVIDER_DEEP_LINKS_DOMAIN}/${modelName}/${modelId}`;

    if (!this.validateServiceProviderDeepLink(deepLink)) {
      this.logger.error(`Invalid service provider deep link generated: ${deepLink}`, {
        modelName,
        modelId,
      });
      return this.getDefaultServiceProviderDeepLink();
    }

    return this.addQueryParamsToDeepLink(deepLink, queryParams);
  }

  validateUserDeepLink(deepLink: string) {
    const domain = this.appConfig.FIREBASE_USER_DEEP_LINKS_DOMAIN;
    const urlWithoutDomain = deepLink.replace(domain + '/', '');

    return this.trie.validateUrl(urlWithoutDomain);
  }

  validateAdminDeepLink(deepLink: string) {
    const domain = this.appConfig.FIREBASE_ADMIN_DEEP_LINKS_DOMAIN;
    const urlWithoutDomain = deepLink.replace(domain + '/', '');

    return this.trie.validateUrl(urlWithoutDomain);
  }

  validateServiceProviderDeepLink(deepLink: string) {
    const domain = this.appConfig.FIREBASE_SERVICE_PROVIDER_DEEP_LINKS_DOMAIN;
    const urlWithoutDomain = deepLink.replace(domain + '/', '');

    return this.trie.validateUrl(urlWithoutDomain);
  }

  getDefaultUserDeepLink() {
    return this.appConfig.FIREBASE_USER_DEFAULT_DEEP_LINK;
  }

  getDefaultAdminDeepLink() {
    return this.appConfig.FIREBASE_ADMIN_DEFAULT_DEEP_LINK;
  }

  getDefaultServiceProviderDeepLink() {
    return this.appConfig.FIREBASE_SERVICE_PROVIDER_DEFAULT_DEEP_LINK;
  }

  private addQueryParamsToDeepLink(deepLink: string, queryParams: Record<string, string | string[]>) {
    if (!queryParams) {
      return deepLink;
    }

    let deepLinkWithQueryParams = deepLink;
    const queryParamsString = Object.keys(queryParams)
      .map((key) => {
        const isValueArray = Array.isArray(queryParams[key]);

        if (isValueArray) {
          return (queryParams[key] as string[]).map((value) => `${key}=${value}`).join('&');
        }

        return `${key}=${queryParams[key]}`;
      })
      .join('&');

    deepLinkWithQueryParams += `?${queryParamsString}`;

    return deepLinkWithQueryParams;
  }

  private constructTrie() {
    this.deepLinkPaths.posts.forEach((path) => this.trie.insert(path));
    this.deepLinkPaths.users.forEach((path) => this.trie.insert(path));
    this.deepLinkPaths.pets.forEach((path) => this.trie.insert(path));
    this.deepLinkPaths.appointments.forEach((path) => this.trie.insert(path));
    this.deepLinkPaths.lostPosts.forEach((path) => this.trie.insert(path));
    this.deepLinkPaths.foundPosts.forEach((path) => this.trie.insert(path));
    this.deepLinkPaths.events.forEach((path) => this.trie.insert(path));
  }
}
