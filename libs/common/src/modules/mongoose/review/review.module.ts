import { ModelNames } from '@common/constants';
import { reviewSchemaFactory } from '@common/schemas/mongoose/review';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const ReviewMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.REVIEW,
  inject: [getConnectionToken()],
  useFactory: reviewSchemaFactory,
};

const reviewProviders = [ReviewMongooseDynamicModule];

@Module({
  imports: [],
  providers: reviewProviders,
  exports: reviewProviders,
})
export class ReviewMongooseModule {}
