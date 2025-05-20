import { Module } from '@nestjs/common';
import { SharedModule } from '@reviews/shared/shared.module';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './controllers/reviews.service';
import { OrderMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, OrderMongooseModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class CustomerModule {}
