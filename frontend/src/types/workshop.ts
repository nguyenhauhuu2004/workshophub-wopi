export type WorkshopMedia = {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
};

export type WorkshopCoordinates = {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
};

export type WorkshopLocation = {
  address: string;
  placeId: string;
  notes: string;
  coordinates: WorkshopCoordinates;
};

export type WorkshopSchedule = {
  _id?: string;
  startAt: string;
  seatsTotal: number;
  spotsLeft: number;
};

export type WorkshopStatus = "draft" | "published" | "cancelled" | "archived";

export type WorkshopFormData = {
  title: string;
  categories: string[];
  description: string;
  highlights: string[];
  price: string;
  duration: string;
  includes: string[];

  thumbnail: File | null;
  gallery: File[];
  video: File | null;

  schedules: WorkshopSchedule[];
  location: WorkshopLocation;

  status?: WorkshopStatus;
};
interface Host {
  _id: string;
  displayName: string;
}

export type Workshop = {
  _id: string;
  host: string | Host;
  title: string;
  categories: string[];
  description: string;
  highlights: string[];
  includes: string[];
  price: number;
  duration: string;

  thumbnail: WorkshopMedia;
  gallery: WorkshopMedia[];
  video: WorkshopMedia | null;

  schedules: WorkshopSchedule[];
  location: WorkshopLocation;
  status: WorkshopStatus;

  createdAt: string;
  updatedAt: string;
};

export type WorkshopLocationForm = Omit<WorkshopLocation, "coordinates"> & {
  coordinates: {
    type: "Point";
    coordinates: [number | null, number | null];
  };
};

export type GoongPlacePrediction = {
  description: string;
  place_id: string;
};

export type GoongPlaceLocation = {
  lat: number;
  lng: number;
};

export type GoongPlaceResult = {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: GoongPlaceLocation;
  };
};
