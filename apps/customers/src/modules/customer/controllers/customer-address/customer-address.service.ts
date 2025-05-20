import { ConflictException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import {
  Area,
  City,
  CustomError,
  ErrorType,
  IAreaInstanceMethods,
  IAreaModel,
  ICityModel,
  ICountryModel,
  ICustomerAddressModel,
  ICustomerModel,
  LocationDto,
  ModelNames,
} from '@instapets-backend/common';
import { AddAddressDto } from './dto/add-address.dto';
import { Document, Types } from 'mongoose';
import { AddressParamIdDto } from './dto/address-param-id.dto';
import { EditAddressDto } from './dto/edit-address.dto';

@Injectable()
export class CustomerAddressService {
  private METERS_TO_KM = 1000;

  constructor(
    @Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel,
    @Inject(ModelNames.CUSTOMER_ADDRESS) private customerAddressModel: ICustomerAddressModel,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
    @Inject(ModelNames.COUNTRY) private countryModel: ICountryModel,
    @Inject(ModelNames.AREA) private areaModel: IAreaModel,
  ) {}

  async addAddress(customerId: string, body: AddAddressDto) {
    const { isDefault, location, ...restOfBody } = body;

    const customer = await this.getCustomerById(customerId);

    const { city, country, area } = await this.adjustCustomerLocation(location);

    const [cityExists, countryExists] = await Promise.all([
      this.cityModel.findById(city),
      this.countryModel.findById(country),
    ]);

    if (!countryExists) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'Country is invalid',
            ar: 'البلد غير صالح',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    if (!cityExists) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'City is invalid',
            ar: 'المدينة غير صالحة',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    const address = new this.customerAddressModel({
      ...restOfBody,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      city: new Types.ObjectId(city),
      country: new Types.ObjectId(country),
      ...(area && { area: new Types.ObjectId(area) }),
      customer: new Types.ObjectId(customerId),
      isDefault,
    });

    await address.save();

    if (isDefault) {
      await this.customerAddressModel.updateMany(
        {
          customer: new Types.ObjectId(customerId),
          _id: { $ne: address._id },
        },
        {
          $set: { isDefault: false },
        },
      );

      customer.activeAddress = address._id;
      await customer.save();
    }
  }

  async getSavedAddresses(customerId: string | Types.ObjectId) {
    const docs = await this.customerAddressModel.aggregate([
      {
        $match: { customer: new Types.ObjectId(customerId) },
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
    ]);

    return docs;
  }

  async getSavedAddressById(customerId: string | Types.ObjectId, { addressId }: AddressParamIdDto) {
    const [doc] = await this.customerAddressModel.aggregate([
      {
        $match: { customer: new Types.ObjectId(customerId), _id: new Types.ObjectId(addressId) },
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
    ]);

    if (!doc) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Address is not found',
            ar: 'العنوان عير موجود',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    return doc;
  }

  async editAddress(customerId: string, { addressId }: AddressParamIdDto, body: EditAddressDto) {
    const { isDefault, location, ...restOfBody } = body;

    const savedAddress = await this.customerAddressModel.findById(addressId);
    if (!savedAddress) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Address is not found',
            ar: 'العنوان عير موجود',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }
    const customer = await this.getCustomerById(customerId);

    const { city, country, area } = await this.adjustCustomerLocation(location);

    const [cityExists, countryExists] = await Promise.all([
      this.cityModel.findById(city),
      this.countryModel.findById(country),
    ]);

    if (!countryExists) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'Country is invalid',
            ar: 'البلد غير صالح',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    if (!cityExists) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'City is invalid',
            ar: 'المدينة غير صالحة',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    const haveDefaultAddress = await this.customerAddressModel.exists({
      customer: new Types.ObjectId(customerId),
      isDefault: true,
    });

    if (!haveDefaultAddress && isDefault === false) {
      throw new ConflictException(
        new CustomError({
          localizedMessage: {
            en: 'You must have one default address',
            ar: 'يجب أن يكون لديك عنوان اساسي واحد',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    savedAddress.set({
      ...restOfBody,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      city: new Types.ObjectId(city),
      country: new Types.ObjectId(country),
      ...(area && { area: new Types.ObjectId(area) }),
      customer: new Types.ObjectId(customerId),
      isDefault,
    });

    await savedAddress.save();

    if (isDefault) {
      await this.customerAddressModel.updateMany(
        {
          customer: new Types.ObjectId(customerId),
          _id: { $ne: savedAddress._id },
        },
        {
          $set: { isDefault: false },
        },
      );

      customer.activeAddress = savedAddress._id;
      await customer.save();
    }
  }
  async getMyCurrentLocation(customerId: string | Types.ObjectId, location: LocationDto) {
    const { city, country, area } = await this.adjustCustomerLocation(location);

    const [cityExists, countryExists] = await Promise.all([
      this.cityModel.findById(city).lean(),
      this.countryModel.findById(country).lean(),
    ]);

    if (!countryExists) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'Country is invalid',
            ar: 'البلد غير صالح',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    if (!cityExists) {
      throw new UnprocessableEntityException(
        new CustomError({
          localizedMessage: {
            en: 'City is invalid',
            ar: 'المدينة غير صالحة',
          },
          errorType: ErrorType.INVALID,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }

    let customerArea: Document<unknown, Record<string, unknown>, Area> &
      Omit<Area & { _id: Types.ObjectId }, keyof IAreaInstanceMethods> &
      IAreaInstanceMethods;
    if (area) {
      customerArea = await this.areaModel.findById(area).lean();
    }

    return {
      ...(customerArea && { area: customerArea }),
      city: cityExists,
      country: countryExists,
      location,
    };
  }

  async setDefaultAddress(customerId: string | Types.ObjectId, { addressId }: AddressParamIdDto) {
    const savedAddress = await this.customerAddressModel.findById(addressId);
    if (!savedAddress) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Address is not found',
            ar: 'العنوان عير موجود',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'VALIDATE_ADDRESS_FAILED',
        }),
      );
    }
    const customer = await this.getCustomerById(customerId);

    savedAddress.isDefault = true;
    await savedAddress.save();

    await this.customerAddressModel.updateMany(
      {
        customer: new Types.ObjectId(customerId),
        _id: { $ne: savedAddress._id },
      },
      {
        $set: { isDefault: false },
      },
    );

    customer.activeAddress = savedAddress._id;
    await customer.save();
  }

  private async getCustomerById(customerId: string | Types.ObjectId) {
    const customer = await this.customerModel.findById(customerId);

    if (!customer) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Customer not found',
            ar: 'المستخدم غير موجود',
          },
          event: 'CUSTOMER_NOT_FOUND',
          errorType: ErrorType.NOT_FOUND,
        }),
      );
    }

    return customer;
  }

  private async adjustCustomerLocation({ lat, lng }: LocationDto): Promise<{
    country: Types.ObjectId;
    city: Types.ObjectId;
    area?: Types.ObjectId;
  }> {
    const locationData = await this.getCustomerLocationData({ lat, lng });

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

    return locationData;
  }

  private async getCustomerLocationData({ lat, lng }: LocationDto) {
    const areaData = await this.getCustomerLocationDataByAreaCoords({ lat, lng });
    if (areaData) return areaData;

    const cityData = await this.getCustomerLocationDataByCityCoords({ lat, lng });
    if (cityData) return cityData;

    return null;
  }

  private async getCustomerLocationDataByAreaCoords({ lat, lng }: LocationDto) {
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

  private async getCustomerLocationDataByCityCoords({ lat, lng }: LocationDto) {
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
}
