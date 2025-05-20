import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  ModelNames,
  IReviewModel,
  IBaseBranchModel,
  CustomLoggerService,
  CustomError,
  Review,
  addPaginationStages,
  IOrderModel,
} from '@instapets-backend/common';
import { Types, Connection, HydratedDocument } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { GetShopReviewsDto } from './dto/get-shop-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(ModelNames.REVIEW) private reviewModel: IReviewModel,
    @Inject(ModelNames.BASE_BRANCH) private baseBranchModel: IBaseBranchModel,
    @Inject(ModelNames.ORDER) private orderModel: IOrderModel,
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: CustomLoggerService,
  ) {}

  async createReview(customerId: string | Types.ObjectId, { rating, shopId, text, orderId }: CreateReviewDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction({
        readPreference: 'primary',
      });

      const createdReview = new this.reviewModel({
        branch: new Types.ObjectId(shopId),
        rating,
        text,
        customer: new Types.ObjectId(customerId),
      });

      await createdReview.save({ session });

      const reviews = await this.reviewModel.find({ branch: new Types.ObjectId(shopId) }).session(session);

      const totalRatingSum = reviews.reduce((prev: number, curr: HydratedDocument<Review>) => prev + curr.rating, 0);
      const totalRatingCount = reviews.length;

      const globalAverage = 4.2; // Global average rating
      const weight = 50; // Minimum ratings to balance global average
      const averageRating = this.calculateRating(totalRatingSum, totalRatingCount, globalAverage, weight);

      await this.baseBranchModel.findByIdAndUpdate(
        shopId,
        {
          $set: {
            rating: averageRating,
            totalRatings: totalRatingSum,
          },
        },
        { session: session },
      );

      await this.orderModel.findByIdAndUpdate(
        orderId,
        {
          $set: {
            rating,
          },
        },
        { session: session },
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Error while creating review`, {
        error,
      });
      throw new InternalServerErrorException(
        new CustomError({
          localizedMessage: {
            en: 'Error while creating review',
            ar: 'خطأ أثناء اضافة تعليق',
          },
          event: 'ERROR_WHILE_CREATING_REVIEW',
        }),
      );
    } finally {
      session.endSession();
    }
  }

  async getShopReviews({ shopId, limit, page }: GetShopReviewsDto, customerId?: string | Types.ObjectId) {
    const matchStage = [
      {
        $match: {
          branch: new Types.ObjectId(shopId),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.reviewModel.aggregate(matchStage).count('total'),
      this.reviewModel.aggregate([
        ...matchStage,
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...addPaginationStages({ page, limit }),
        {
          $lookup: {
            from: 'customers',
            let: { customerId: '$customer' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$customerId'],
                  },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                },
              },
            ],
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            customer: 1,
            rating: 1,
            createdAt: 1,
            text: 1,
          },
        },
      ]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private calculateRating(totalRatingSum: number, numberOfRatings: number, globalAverage = 4.2, weight = 50) {
    if (numberOfRatings === 0) {
      return globalAverage; // Default to global average if no ratings
    }

    const weightedRating = (totalRatingSum + weight * globalAverage) / (numberOfRatings + weight);
    return parseFloat(weightedRating.toFixed(2)); // Round to 2 decimal places
  }
}
