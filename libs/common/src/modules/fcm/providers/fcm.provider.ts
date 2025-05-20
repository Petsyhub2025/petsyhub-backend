import { FactoryProvider, Logger, ValueProvider } from '@nestjs/common';
import firebaseAdmin from 'firebase-admin';
import {
  FCM_MODULE_OPTIONS,
  FCM_MODULE_MERGED_OPTIONS,
  FCM_USER_APP,
  FCM_ADMIN_APP,
  FCM_SERVICE_PROVIDER_APP,
} from '@common/modules/fcm/constants';
import { fcmDefaultOptions } from '@common/modules/fcm/defaults';
import { FCMModuleOptions, FCMModuleAsyncOptions } from '@common/modules/fcm/interfaces';
import { EnvironmentEnum } from '@common/enums';
import { readFile } from 'fs/promises';

export const createFCMOptionsProvider = (options: FCMModuleOptions): ValueProvider => {
  return {
    provide: FCM_MODULE_OPTIONS,
    useValue: options || {},
  };
};

export const createFCMAsyncOptionProviders = (options: FCMModuleAsyncOptions): FactoryProvider => {
  return {
    provide: FCM_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const fcmMergedOptionsProvider: FactoryProvider<FCMModuleOptions> = {
  provide: FCM_MODULE_MERGED_OPTIONS,
  useFactory: (options: FCMModuleOptions) => ({
    ...fcmDefaultOptions,
    ...options,
  }),
  inject: [FCM_MODULE_OPTIONS],
};

export const fcmUserAppProvider: FactoryProvider<firebaseAdmin.app.App> = {
  provide: FCM_USER_APP,
  useFactory: async (options: FCMModuleOptions) => {
    const logger = new Logger('FCMModule');

    const { firebaseEnv } = options;

    const env = firebaseEnv === EnvironmentEnum.LOCAL ? EnvironmentEnum.DEV : firebaseEnv;

    const serviceAccountFile = `${env}-backend-user-firebase-service-account.json`;

    try {
      const serviceAccount = await readFCMServiceAccountFile(process.cwd() + '/' + serviceAccountFile);
      logger.log('FCM user service account file was loaded successfully');
      return firebaseAdmin.initializeApp(
        {
          credential: firebaseAdmin.credential.cert(serviceAccount),
        },
        'FCM_USER_APP',
      );
    } catch (error) {
      logger.error('FCM user service account file was not found');
      return null;
    }
  },
  inject: [FCM_MODULE_MERGED_OPTIONS],
};

export const fcmAdminAppProvider: FactoryProvider<firebaseAdmin.app.App> = {
  provide: FCM_ADMIN_APP,
  useFactory: async (options: FCMModuleOptions) => {
    const logger = new Logger('FCMModule');

    const { firebaseEnv } = options;

    const env = firebaseEnv === EnvironmentEnum.LOCAL ? EnvironmentEnum.DEV : firebaseEnv;

    const serviceAccountFile = `${env}-backend-admin-firebase-service-account.json`;

    try {
      const serviceAccount = await readFCMServiceAccountFile(process.cwd() + '/' + serviceAccountFile);
      logger.log('FCM admin service account file was loaded successfully');
      return firebaseAdmin.initializeApp(
        {
          credential: firebaseAdmin.credential.cert(serviceAccount),
        },
        'FCM_ADMIN_APP',
      );
    } catch (error) {
      logger.error('FCM admin service account file was not found');
      return null;
    }
  },
  inject: [FCM_MODULE_MERGED_OPTIONS],
};

export const fcmServiceProviderAppProvider: FactoryProvider<firebaseAdmin.app.App> = {
  provide: FCM_SERVICE_PROVIDER_APP,
  useFactory: async (options: FCMModuleOptions) => {
    const logger = new Logger('FCMModule');

    const { firebaseEnv } = options;

    const env = firebaseEnv === EnvironmentEnum.LOCAL ? EnvironmentEnum.DEV : firebaseEnv;

    const serviceAccountFile = `${env}-backend-serviceprovider-firebase-service-account.json`;

    try {
      const serviceAccount = await readFCMServiceAccountFile(process.cwd() + '/' + serviceAccountFile);
      logger.log('FCM user service account file was loaded successfully');
      return firebaseAdmin.initializeApp(
        {
          credential: firebaseAdmin.credential.cert(serviceAccount),
        },
        'FCM_SERVICE_PROVIDER_APP',
      );
    } catch (error) {
      logger.error('FCM service provider service account file was not found');
      return null;
    }
  },
  inject: [FCM_MODULE_MERGED_OPTIONS],
};

export async function readFCMServiceAccountFile(serviceAccountFile: string): Promise<firebaseAdmin.ServiceAccount> {
  const file = await readFile(serviceAccountFile, 'utf8');
  return JSON.parse(file) as firebaseAdmin.ServiceAccount;
}
