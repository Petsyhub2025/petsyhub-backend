import { Module } from '@nestjs/common';
import {
  AppConfig,
  AwsLambdaModule,
  BranchMongooseModule,
  CityMongooseModule,
  LostFoundMongooseModule,
  MediaUploadService,
  PendingPetFollowMongooseModule,
  PetBreedMongooseModule,
  PetFollowMongooseModule,
  PetMongooseModule,
  PetTypeMongooseModule,
  UserFollowMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';
import { PetFollowCreationHelperService } from './services/pet-follow-creation-helper.service';

const imports = [
  AwsLambdaModule.registerAsync({
    useFactory: (appConfig: AppConfig) => ({
      accessKeyId: appConfig.AWS_LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: appConfig.AWS_LAMBDA_SECRET_ACCESS_KEY,
      region: appConfig.AWS_LAMBDA_REGION,
    }),
    inject: [AppConfig],
  }),
  UserMongooseModule,
  PetMongooseModule,
  PetBreedMongooseModule,
  PetTypeMongooseModule,
  PetFollowMongooseModule,
  UserFollowMongooseModule,
  PendingPetFollowMongooseModule,
  CityMongooseModule,
  LostFoundMongooseModule,
  BranchMongooseModule,
];
const providers = [PetFollowCreationHelperService, MediaUploadService];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
