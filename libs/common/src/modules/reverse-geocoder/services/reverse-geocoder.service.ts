import { ModelNames } from '@common/constants';
import { LocationDto } from '@common/dtos';
import { ErrorType } from '@common/enums';
import { Inject, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import axios from 'axios';
import { Types } from 'mongoose';
import { AcceptedLanguages, ReverseGeocodedLocationResponse, AcceptedResultTypes } from '../types';
import { CustomError } from '@common/classes/custom-error.class';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { ICityModel, City } from '@common/schemas/mongoose/city/city.type';
import { GooglePlacesLocation } from '@common/schemas/mongoose/common/google-places-location';

@Injectable()
export class ReverseGeocoderService {
  private METERS_TO_KM = 1000;
  private logger = new Logger(ReverseGeocoderService.name);
  private errorManager = {
    INVALID_LOCATION: new CustomError({
      localizedMessage: {
        en: 'Invalid location or location unsupported',
        ar: 'موقع غير صالح أو غير مدعوم',
      },
      event: 'INVALID_LOCATION',
      errorType: ErrorType.WRONG_REQUEST,
    }),
  };

  constructor(
    private readonly appConfig: AppConfig,
    @Inject(ModelNames.CITY) private cityModel: ICityModel,
  ) {}

  async getGooglePlacesLocation(location: LocationDto): Promise<GooglePlacesLocation> {
    const { lat, lng } = location;

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
      this.logger.error('No internal city found for location', {
        location,
      });
      throw new UnprocessableEntityException(this.errorManager.INVALID_LOCATION);
    }

    const reverseGeocodedLocations = await this.getReverseGeocodedLocations(location);

    if (!reverseGeocodedLocations.length) {
      this.logger.error('No reverse geocoded locations found', {
        location,
      });
      throw new UnprocessableEntityException(this.errorManager.INVALID_LOCATION);
    }

    type ReverseGeoCodedLocationsAccumulatorType = {
      area: Record<AcceptedLanguages, string>;
      formattedAddress: Record<AcceptedLanguages, string>;
    };

    const localizedAreaAndAddress = reverseGeocodedLocations.reduce<ReverseGeoCodedLocationsAccumulatorType>(
      (acc, reverseGeocodedLocation) => {
        const { results, lang, status } = reverseGeocodedLocation;

        if (status !== 'OK') {
          this.logger.error('Reverse geocoding failed', {
            reverseGeocodedLocation,
          });
          throw new UnprocessableEntityException(this.errorManager.INVALID_LOCATION);
        }

        const [result] = results;

        const district = this.getNameFromAddressComponents(result.address_components, 'administrative_area_level_2');
        const formattedAddress = result.formatted_address;

        return {
          ...acc,
          area: {
            ...acc.area,
            [lang]: district,
          },
          formattedAddress: {
            ...acc.formattedAddress,
            [lang]: formattedAddress,
          },
        };
      },
      {} as ReverseGeoCodedLocationsAccumulatorType,
    );

    const { area, formattedAddress } = localizedAreaAndAddress;

    const lostFoundLocation: GooglePlacesLocation = {
      city: city._id,
      country: city.country,
      googlePlaceId: reverseGeocodedLocations[0].results?.[0]?.place_id,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address: formattedAddress,
      area: area,
    };

    return lostFoundLocation;
  }

  private async getReverseGeocodedLocations(location: LocationDto) {
    const allLanguages = Object.values(AcceptedLanguages);
    let _splicedLanguages: AcceptedLanguages[] = [];
    const reverseGeocodedLocations: ReverseGeocodedLocationResponse[] = [];

    while ((_splicedLanguages = allLanguages.splice(0, 10)).length) {
      const promises = _splicedLanguages.map((lang) => this._getReverseGeocodedLocation(location, lang));
      const results = await Promise.all(promises);
      reverseGeocodedLocations.push(...results);
    }

    return reverseGeocodedLocations;
  }

  private async _getReverseGeocodedLocation(location: LocationDto, lang: AcceptedLanguages) {
    const { data } = await axios.get<ReverseGeocodedLocationResponse>(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: this.getReverseGeocodeQueryParams(location, lang),
      },
    );

    this.logger.debug('Reverse geocoded location', {
      location,
      lang,
      data,
    });

    return {
      ...data,
      lang,
    };
  }

  private getReverseGeocodeQueryParams({ lat, lng }: LocationDto, lang: AcceptedLanguages) {
    const queryParams: Record<string, string> = {
      latlng: `${lat},${lng}`,
      key: this.appConfig.USER_MAPS_API_KEY,
      language: lang,
      result_type: 'country|street_address|administrative_area_level_1|administrative_area_level_2',
    };

    return queryParams;
  }

  private getNameFromAddressComponents(
    addressComponents: ReverseGeocodedLocationResponse['results'][0]['address_components'],
    type: AcceptedResultTypes,
  ) {
    const addressComponent = addressComponents.find((component) => component.types.includes(type));

    return addressComponent?.long_name;
  }
}
