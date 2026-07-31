export type GoongPlacePrediction = {
  description: string;
  place_id: string;
};

export type GoongPlaceDetail = {
  place_id?: string;
  formatted_address?: string;

  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
};

export type GoongGeocodeResult = {
  place_id?: string;
  formatted_address?: string;
};
