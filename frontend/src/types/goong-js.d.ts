declare module "@goongmaps/goong-js" {
  export type LngLatLike =
    | [number, number]
    | {
        lng: number;
        lat: number;
      };

  export interface LngLat {
    lng: number;
    lat: number;
  }

  export interface MapOptions {
    container: string | HTMLElement;
    style: string;
    center?: LngLatLike;
    zoom?: number;
  }

  export interface FlyToOptions {
    center?: LngLatLike;
    zoom?: number;
    essential?: boolean;
  }

  export interface MapMouseEvent {
    lngLat: LngLat;
  }

  export class Map {
    constructor(options: MapOptions);

    addControl(
      control: NavigationControl,
      position?: "top-left" | "top-right" | "bottom-left" | "bottom-right",
    ): this;

    on(type: "click", listener: (event: MapMouseEvent) => void): this;

    flyTo(options: FlyToOptions): this;

    remove(): void;
  }

  export interface MarkerOptions {
    draggable?: boolean;
  }

  export class Marker {
    constructor(options?: MarkerOptions);

    setLngLat(lngLat: LngLatLike): this;
    addTo(map: Map): this;
    getLngLat(): LngLat;

    on(type: "dragend", listener: () => void): this;

    remove(): void;
  }

  export class NavigationControl {}

  const goongjs: {
    accessToken: string;
    Map: typeof Map;
    Marker: typeof Marker;
    NavigationControl: typeof NavigationControl;
  };

  export default goongjs;
}
