import { EnvironmentEnum } from '@common/enums';
import { IProcessEnv } from '@common/interfaces/env';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig implements IProcessEnv {
  constructor(private readonly configService: ConfigService) {}

  NODE_ENV: string = this.configService.get('NODE_ENV');
  MONGODB_URL: string = this.configService.get('MONGODB_URL');
  USER_JWT_SECRET: string = this.configService.get('USER_JWT_SECRET');
  USER_JWT_REFRESH_SECRET: string = this.configService.get('USER_JWT_REFRESH_SECRET');
  USER_JWT_EXPIRY: number = this.configService.get('USER_JWT_EXPIRY');
  USER_JWT_REFRESH_EXPIRY: string = this.configService.get('USER_JWT_REFRESH_EXPIRY');
  CUSTOMER_JWT_SECRET: string = this.configService.get('CUSTOMER_JWT_SECRET');
  CUSTOMER_JWT_REFRESH_SECRET: string = this.configService.get('CUSTOMER_JWT_REFRESH_SECRET');
  CUSTOMER_JWT_EXPIRY: number = this.configService.get('CUSTOMER_JWT_EXPIRY');
  CUSTOMER_JWT_REFRESH_EXPIRY: string = this.configService.get('CUSTOMER_JWT_REFRESH_EXPIRY');
  ADMIN_JWT_SECRET: string = this.configService.get('ADMIN_JWT_SECRET');
  ADMIN_JWT_REFRESH_SECRET: string = this.configService.get('ADMIN_JWT_REFRESH_SECRET');
  ADMIN_JWT_EXPIRY: number = this.configService.get('ADMIN_JWT_EXPIRY');
  ADMIN_JWT_REFRESH_EXPIRY: string = this.configService.get('ADMIN_JWT_REFRESH_EXPIRY');
  CLINIC_JWT_SECRET: string = this.configService.get('CLINIC_JWT_SECRET');
  CLINIC_JWT_REFRESH_SECRET: string = this.configService.get('CLINIC_JWT_REFRESH_SECRET');
  CLINIC_JWT_EXPIRY: number = this.configService.get('CLINIC_JWT_EXPIRY');
  CLINIC_JWT_REFRESH_EXPIRY: string = this.configService.get('CLINIC_JWT_REFRESH_EXPIRY');
  S2S_JWT_SECRET: string = this.configService.get('S2S_JWT_SECRET');
  NEO4J_DB_URL: string = this.configService.get('NEO4J_DB_URL');
  NEO4J_USER: string = this.configService.get('NEO4J_USER');
  NEO4J_PASSWORD: string = this.configService.get('NEO4J_PASSWORD');
  APP_SHORT_NAME: string = this.configService.get('APP_SHORT_NAME');
  REDIS_HOST: string = this.configService.get('REDIS_HOST');
  REDIS_PORT: number = this.configService.get('REDIS_PORT');
  RABBIT_URI: string = this.configService.get('RABBIT_URI');
  LOGDNA_KEY: string = this.configService.get('LOGDNA_KEY');
  AWS_UPLOAD_BUCKET_NAME: string = this.configService.get('AWS_UPLOAD_BUCKET_NAME');
  AWS_TEMP_UPLOAD_BUCKET_NAME: string = this.configService.get('AWS_TEMP_UPLOAD_BUCKET_NAME');
  AWS_UPLOAD_ACCESS_KEY_ID: string = this.configService.get('AWS_UPLOAD_ACCESS_KEY_ID');
  AWS_UPLOAD_SECRET_ACCESS_KEY: string = this.configService.get('AWS_UPLOAD_SECRET_ACCESS_KEY');
  AWS_UPLOAD_REGION: string = this.configService.get('AWS_UPLOAD_REGION');
  MEDIA_DOMAIN: string = this.configService.get('MEDIA_DOMAIN');
  AWS_SES_ACCESS_KEY_ID: string = this.configService.get('AWS_SES_ACCESS_KEY_ID');
  AWS_SES_SECRET_ACCESS_KEY: string = this.configService.get('AWS_SES_SECRET_ACCESS_KEY');
  AWS_SES_REGION: string = this.configService.get('AWS_SES_REGION');
  AWS_SNS_VIDEO_ANALYSIS_TOPIC_ARN: string = this.configService.get('AWS_SNS_VIDEO_ANALYSIS_TOPIC_ARN');
  AWS_REKOGNITION_ACCESS_KEY_ID: string = this.configService.get('AWS_REKOGNITION_ACCESS_KEY_ID');
  AWS_REKOGNITION_SECRET_ACCESS_KEY: string = this.configService.get('AWS_REKOGNITION_SECRET_ACCESS_KEY');
  AWS_REKOGNITION_REGION: string = this.configService.get('AWS_REKOGNITION_REGION');
  AWS_REKOGNITION_JOB_ROLE_ARN: string = this.configService.get('AWS_REKOGNITION_JOB_ROLE_ARN');
  AWS_COGNITO_ACCESS_KEY_ID: string = this.configService.get('AWS_COGNITO_ACCESS_KEY_ID');
  AWS_COGNITO_SECRET_ACCESS_KEY: string = this.configService.get('AWS_COGNITO_SECRET_ACCESS_KEY');
  AWS_COGNITO_REGION: string = this.configService.get('AWS_COGNITO_REGION');
  AWS_COGNITO_IDENTITY_POOL_ID: string = this.configService.get('AWS_COGNITO_IDENTITY_POOL_ID');
  AWS_COGNITO_DEVELOPER_IDENTITY_ID: string = this.configService.get('AWS_COGNITO_DEVELOPER_IDENTITY_ID');
  AWS_SCHEDULER_ACCESS_KEY_ID: string = this.configService.get('AWS_SCHEDULER_ACCESS_KEY_ID');
  AWS_SCHEDULER_SECRET_ACCESS_KEY: string = this.configService.get('AWS_SCHEDULER_SECRET_ACCESS_KEY');
  AWS_SCHEDULER_REGION: string = this.configService.get('AWS_SCHEDULER_REGION');
  AWS_SCHEDULER_LAMBDA_PUSH_NOTIFICATIONS_ARN: string = this.configService.get(
    'AWS_SCHEDULER_LAMBDA_PUSH_NOTIFICATIONS_ARN',
  );
  AWS_SCHEDULER_SERVICE_ROLE_ARN: string = this.configService.get('AWS_SCHEDULER_SERVICE_ROLE_ARN');
  AWS_LAMBDA_ACCESS_KEY_ID: string = this.configService.get('AWS_LAMBDA_ACCESS_KEY_ID');
  AWS_LAMBDA_SECRET_ACCESS_KEY: string = this.configService.get('AWS_LAMBDA_SECRET_ACCESS_KEY');
  AWS_LAMBDA_REGION: string = this.configService.get('AWS_LAMBDA_REGION');
  AWS_LAMBDA_MEDIA_MODERATION_FUNCTION_NAME: string = this.configService.get(
    'AWS_LAMBDA_MEDIA_MODERATION_FUNCTION_NAME',
  );
  ADMIN_GOOGLE_CLIENT_ID: string = this.configService.get('ADMIN_GOOGLE_CLIENT_ID');
  ADMIN_GOOGLE_SECRET: string = this.configService.get('ADMIN_GOOGLE_SECRET');
  USER_GOOGLE_CLIENT_ID: string = this.configService.get('USER_GOOGLE_CLIENT_ID');
  USER_GOOGLE_SECRET: string = this.configService.get('USER_GOOGLE_SECRET');
  USER_APPLE_CLIENT_ID: string = this.configService.get('USER_APPLE_CLIENT_ID');
  CUSTOMER_GOOGLE_CLIENT_ID: string = this.configService.get('CUSTOMER_GOOGLE_CLIENT_ID');
  CUSTOMER_GOOGLE_SECRET: string = this.configService.get('CUSTOMER_GOOGLE_SECRET');
  CUSTOMER_APPLE_CLIENT_ID: string = this.configService.get('CUSTOMER_APPLE_CLIENT_ID');
  ELASTIC_SEARCH_URL: string = this.configService.get('ELASTIC_SEARCH_URL');
  FIREBASE_USER_API_KEY: string = this.configService.get('FIREBASE_USER_API_KEY');
  FIREBASE_USER_DYNAMIC_LINKS_DOMAIN: string = this.configService.get('FIREBASE_USER_DYNAMIC_LINKS_DOMAIN');
  FIREBASE_USER_DEEP_LINKS_DOMAIN: string = this.configService.get('FIREBASE_USER_DEEP_LINKS_DOMAIN');
  FIREBASE_USER_DEFAULT_DYNAMIC_LINK: string = this.configService.get('FIREBASE_USER_DEFAULT_DYNAMIC_LINK');
  FIREBASE_USER_DEFAULT_DEEP_LINK: string = this.configService.get('FIREBASE_USER_DEFAULT_DEEP_LINK');
  FIREBASE_ADMIN_DEEP_LINKS_DOMAIN: string = this.configService.get('FIREBASE_ADMIN_DEEP_LINKS_DOMAIN');
  FIREBASE_ADMIN_DEFAULT_DEEP_LINK: string = this.configService.get('FIREBASE_ADMIN_DEFAULT_DEEP_LINK');
  USER_APP_NAME: string = this.configService.get('USER_APP_NAME');
  USER_APP_DESCRIPTION: string = this.configService.get('USER_APP_DESCRIPTION');
  USER_APP_LOGO: string = this.configService.get('USER_APP_LOGO');
  USER_APP_ANDROID_PACKAGE_NAME: string = this.configService.get('USER_APP_ANDROID_PACKAGE_NAME');
  USER_APP_IOS_PACKAGE_NAME: string = this.configService.get('USER_APP_IOS_PACKAGE_NAME');
  CLINICS_RESET_PASSWORD_PATH: string = this.configService.get('CLINICS_RESET_PASSWORD_PATH');
  CLINICS_DOMAIN: string = this.configService.get('CLINICS_DOMAIN');
  CLINICS_EMAIL_VERIFICATION_PATH: string = this.configService.get('CLINICS_EMAIL_VERIFICATION_PATH');
  USER_MAPS_API_KEY: string = this.configService.get('USER_MAPS_API_KEY');
  FIREBASE_SERVICE_PROVIDER_DEEP_LINKS_DOMAIN: string = this.configService.get(
    'FIREBASE_SERVICE_PROVIDER_DEEP_LINKS_DOMAIN',
  );
  FIREBASE_SERVICE_PROVIDER_DEFAULT_DEEP_LINK: string = this.configService.get(
    'FIREBASE_SERVICE_PROVIDER_DEFAULT_DEEP_LINK',
  );
  STRIPE_WEBHOOK_SECRET: string = this.configService.get('STRIPE_WEBHOOK_SECRET');
  STRIPE_SECRET_KEY: string = this.configService.get('STRIPE_SECRET_KEY');
  get UPTIME() {
    return process.uptime();
  }

  static get NODE_ENV() {
    return process.env.NODE_ENV as EnvironmentEnum;
  }
}
