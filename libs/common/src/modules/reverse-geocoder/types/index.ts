export enum AcceptedLanguages {
  EN = 'en',
  AR = 'ar',
}
export type ReverseGeocodedLocationResponse = {
  results: {
    address_components: {
      long_name: string;
      short_name: string;
      types: string[];
    }[];
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: {
          lat: number;
          lng: number;
        };
        southwest: {
          lat: number;
          lng: number;
        };
      };
    };
    place_id: string;
    plus_code: {
      compound_code: string;
      global_code: string;
    };
    types: string[];
  }[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  lang: AcceptedLanguages;
};
export type AcceptedResultTypes =
  | 'country'
  | 'street_address'
  | 'administrative_area_level_1'
  | 'administrative_area_level_2';
