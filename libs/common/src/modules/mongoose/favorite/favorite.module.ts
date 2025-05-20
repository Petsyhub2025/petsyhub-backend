import { ModelNames } from '@common/constants';
import { favoriteSchemaFactory } from '@common/schemas/mongoose/favorite';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const FavoriteMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.FAVORITE,
  inject: [getConnectionToken()],
  useFactory: favoriteSchemaFactory,
};

const favoriteProviders = [FavoriteMongooseDynamicModule];

@Module({
  imports: [],
  providers: favoriteProviders,
  exports: favoriteProviders,
})
export class FavoriteMongooseModule {}
