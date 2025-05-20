import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  Area,
  City,
  CustomError,
  ErrorType,
  IAreaModel,
  ICityModel,
  ICountryModel,
  IUserAddressModel,
  IUserModel,
  LocationDto,
  ModelNames,
} from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class UserAddressService {
  private METERS_TO_KM = 1000;

  constructor(
    @Inject(ModelNames.USER) private userModel: IUserModel,
    @Inject(ModelNames.USER_ADDRESS) private userAddressModel: IUserAddressModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.AREA) private areaModel: IAreaModel,
  ) {}

  async adjustUserLocation(userId: string, { lat, lng }: LocationDto) {
    const user = await this.userModel.findById(userId);

    const locationData = await this.getUserLocationData({ lat, lng });

    if (!locationData) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'Location is invalid',
            ar: 'الموقع غير صالح',
          },
          errorType: ErrorType.INVALID,
          event: 'INVALID_LOCATION',
        }),
      );
    }

    user.set({
      ...locationData,
    });

    await user.save();
  }

  private async getUserLocationData({ lat, lng }: LocationDto) {
    const areaData = await this.getUserLocationDataByAreaCoords({ lat, lng });
    if (areaData) return areaData;

    const cityData = await this.getUserLocationDataByCityCoords({ lat, lng });
    if (cityData) return cityData;

    return null;
  }

  private async getUserLocationDataByAreaCoords({ lat, lng }: LocationDto) {
    const [area] = await this.areaModel.aggregate<Hydrate<Area & { country: Types.ObjectId }>>([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distance',
          maxDistance: 50 * this.METERS_TO_KM,
          spherical: true,
        },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
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
        $project: {
          _id: 1,
          city: '$city._id',
          country: '$city.country',
        },
      },
    ]);

    if (!area) {
      return null;
    }

    return {
      area: area._id,
      country: area.country,
      city: area.city,
    };
  }

  private async getUserLocationDataByCityCoords({ lat, lng }: LocationDto) {
    const [city] = await this.cityModel.aggregate<Hydrate<City & { country: Types.ObjectId }>>([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distance',
          maxDistance: 150 * this.METERS_TO_KM,
          spherical: true,
        },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: 'countries',
          localField: 'country',
          foreignField: '_id',
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
        $project: {
          _id: 1,
          country: '$country._id',
        },
      },
    ]);

    if (!city) {
      return null;
    }

    return {
      country: city.country,
      city: city._id,
    };
  }

  // async addAddress(userId: string, body: AddAddressDto) {
  //   const { city, country } = body;

  //   const user = await this.getUserById(userId);

  //   const [cityExists, countryExists, pendingAddressExists] = await Promise.all([
  //     this.cityModel.findById(city),
  //     this.countryModel.findById(country),
  //     this.userAddressModel.findOne({ user: user._id, isPendingAddress: true }),
  //   ]);

  //   if (!countryExists) {
  //     throw new UnprocessableEntityException(
  //       new CustomError({
  //         localizedMessage: {
  //           en: 'Country is invalid',
  //           ar: 'البلد غير صالح',
  //         },
  //         errorType: ErrorType.INVALID,
  //         event: 'VALIDATE_ADDRESS_FAILED',
  //       }),
  //     );
  //   }

  //   if (!cityExists) {
  //     throw new UnprocessableEntityException(
  //       new CustomError({
  //         localizedMessage: {
  //           en: 'City is invalid',
  //           ar: 'المدينة غير صالحة',
  //         },
  //         errorType: ErrorType.INVALID,
  //         event: 'VALIDATE_ADDRESS_FAILED',
  //       }),
  //     );
  //   }

  //   if (pendingAddressExists) {
  //     throw new UnprocessableEntityException(
  //       new CustomError({
  //         localizedMessage: {
  //           en: 'Pending address already exists',
  //           ar: 'عنوان معلق موجود بالفعل',
  //         },
  //         errorType: ErrorType.INVALID,
  //         event: 'VALIDATE_ADDRESS_FAILED',
  //       }),
  //     );
  //   }

  //   const address = new this.userAddressModel({
  //     ...body,
  //     user: user._id,
  //   });

  //   await address.save();

  //   if (!user.activeAddress) {
  //     user.activeAddress = address._id;
  //     await user.save();
  //   }

  //   return address;
  // }

  // private async getUserById(userId: string) {
  //   const user = await this.userModel.findById(userId);

  //   if (!user) {
  //     throw new NotFoundException(
  //       new CustomError({
  //         localizedMessage: {
  //           en: 'User not found',
  //           ar: 'المستخدم غير موجود',
  //         },
  //         event: 'USER_NOT_FOUND',
  //         errorType: ErrorType.NOT_FOUND,
  //       }),
  //     );
  //   }

  //   return user;
  // }
}
