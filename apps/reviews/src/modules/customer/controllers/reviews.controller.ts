import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomResponse, IsPrivateAuthOrPublic, Persona, CustomerJwtPersona } from '@instapets-backend/common';
import { ReviewsService } from './reviews.service';
import { globalControllerVersioning } from '@reviews/shared/constants';
import { GetShopReviewsDto } from './dto/get-shop-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller({ path: 'reviews', ...globalControllerVersioning })
@ApiTags('customer/review')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @Get()
  @ApiBearerAuth()
  async getShopReviews(@Persona() customerJWT: CustomerJwtPersona, @Query() query: GetShopReviewsDto) {
    const reviews = await this.reviewService.getShopReviews(query, customerJWT._id);
    return new CustomResponse().success({
      payload: reviews,
    });
  }

  @Get('public')
  @IsPrivateAuthOrPublic()
  async getShopReviewsGuest(@Query() query: GetShopReviewsDto) {
    const reviews = await this.reviewService.getShopReviews(query);
    return new CustomResponse().success({
      payload: reviews,
    });
  }

  @Post()
  @ApiBearerAuth()
  async createReview(@Persona() customerJWT: CustomerJwtPersona, @Body() body: CreateReviewDto) {
    await this.reviewService.createReview(customerJWT._id, body);
    return new CustomResponse().success({});
  }
}
