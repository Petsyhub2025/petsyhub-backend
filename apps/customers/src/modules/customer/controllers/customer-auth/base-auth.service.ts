import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  AppConfig,
  CustomError,
  ErrorType,
  ICustomerModel,
  Customer,
  UserRoleEnum,
  User,
  IUserInstanceMethods,
  CustomerEventsEnum,
} from '@instapets-backend/common';
import Redis from 'ioredis';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BaseAuthService {
  protected readonly redis: Redis;

  constructor(
    protected customerModel: ICustomerModel,
    protected readonly appConfig: AppConfig,
    protected readonly jwtService: JwtService,
    protected readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.redis = this.redisService.getClient();
  }

  async handleCustomerLoginAndGenerateTokens(customerId: string | Types.ObjectId, event?: string) {
    const customer = await this.customerModel.findById(customerId);

    if (customer.role === UserRoleEnum.SUSPENDED) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Your account is suspended',
            ar: 'تم تعليق حسابك',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const _customer = await this.findCustomer(customerId);

    //the event param is only sent when refresh token is refreshed, so it doesnt send that email repeatedly on token refresh
    if (!event) {
      this.eventEmitter.emit(CustomerEventsEnum.CUSTOMER_LOGIN_SUCCESS, customer);
    }

    return {
      ..._customer,
      ...(await this.generateTokens(customer)),
    };
  }

  async generateAccessToken(customer: HydratedDocument<Customer>) {
    const customerId = customer._id;

    // Generate new session id and save it to redis
    const sessionId = await this.createSession(customer);

    const token = this.jwtService.sign(
      { _id: customerId, sessionId },
      {
        secret: this.appConfig.CUSTOMER_JWT_SECRET,
        expiresIn: this.appConfig.CUSTOMER_JWT_EXPIRY || 1200,
      },
    );

    return {
      accessToken: token,
      sessionId: sessionId,
    };
  }

  async createSession(customer: HydratedDocument<Customer>) {
    const session = uuidV5(uuidV4(), uuidV4());

    await this.redis.lpush(customer._id?.toString(), session);

    return session;
  }

  async generateRefreshToken(customer: HydratedDocument<Customer>, sessionId: string) {
    return this.jwtService.sign(
      { sessionId, _id: customer._id },
      {
        secret: this.appConfig.CUSTOMER_JWT_REFRESH_SECRET,
        expiresIn: this.appConfig.CUSTOMER_JWT_REFRESH_EXPIRY || 7200,
      },
    );
  }

  async generateTokens(customer: HydratedDocument<Customer>) {
    const { accessToken, sessionId: newSessionId } = await this.generateAccessToken(customer);
    const refreshToken = await this.generateRefreshToken(customer, newSessionId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async createCustomerAccountFromRegisteredSocialAccount(
    user: HydratedDocument<User, IUserInstanceMethods>,
    password: string,
  ) {
    // Compare entered password with registered account password
    if (!password) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'You have not set a password for your account, please login with your social account or reset your password to create a new one',
            ar: 'لم تقم بتعيين كلمة مرور لحسابك ، يرجى تسجيل الدخول باستخدام حسابك الاجتماعي أو إعادة تعيين كلمة المرور لإنشاء كلمة مرور جديدة',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException(
        new CustomError({
          localizedMessage: {
            en: 'Incorrect Email or password',
            ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          },
          event: 'LOGIN_FAILED',
          errorType: ErrorType.UNAUTHORIZED,
        }),
      );
    }

    // Create customer account if user entered valid password for social account
    const createdCustomerAccount = new this.customerModel({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      socialAccountId: user._id,
      ownedPets: user.ownedPets,
    });

    await createdCustomerAccount.save();

    return createdCustomerAccount;
  }

  private async findCustomer(customerId: string | Types.ObjectId) {
    const [customer] = await this.customerModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(customerId),
        },
      },
      {
        $lookup: {
          from: 'customeraddresses',
          let: { customerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$customer', '$$customerId'],
                },
              },
            },
            {
              $lookup: {
                from: 'countries',
                let: {
                  countryId: '$country',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$_id',
                          {
                            $ifNull: ['$$countryId', null],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'country',
              },
            },
            {
              $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'cities',
                let: {
                  cityId: '$city',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $ifNull: ['$$cityId', null] }],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'city',
              },
            },
            {
              $unwind: {
                path: '$city',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'areas',
                let: {
                  areaId: '$area',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $ifNull: ['$$areaId', null] }],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: 'area',
              },
            },
            {
              $unwind: {
                path: '$area',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                city: 1,
                country: 1,
                area: 1,
                streetName: 1,
                location: 1,
                isDefault: 1,
                labelName: 1,
                addressType: 1,
                phoneNumber: 1,
                buildingName: 1,
                apartmentNumber: 1,
                floor: 1,
                additionalNotes: 1,
                landMark: 1,
                houseName: 1,
                companyName: 1,
              },
            },
          ],
          as: 'savedAddresses',
        },
      },
      {
        $addFields: {
          username: {
            $concat: ['$firstName', ' ', '$lastName'],
          },
        },
      },
      {
        $project: {
          savedAddresses: 1,
          username: 1,
        },
      },
    ]);

    return customer;
  }
}
