declare module "@goongmaps/goong-js" {
  export type LngLatLike =
    | [number, number]
    | {
        lng: number;
        lat: number;
      };

  export type ControlPosition =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

  export interface LngLat {
    lng: number;
    lat: number;
  }

  export interface MapOptions {
    container: string | HTMLElement;
    style: string;
    center?: LngLatLike;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
  }

  export interface FlyToOptions {
    center?: LngLatLike;
    zoom?: number;
    essential?: boolean;
    duration?: number;
  }

  export interface FitBoundsOptions {
    padding?:
      | number
      | {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };

    maxZoom?: number;
    duration?: number;
  }

  export interface MapMouseEvent {
    lngLat: LngLat;
  }

  export class NavigationControl {}

  export class LngLatBounds {
    constructor(southwest?: LngLatLike, northeast?: LngLatLike);

    extend(coordinates: LngLatLike | LngLatBounds): this;

    isEmpty(): boolean;

    getCenter(): LngLat;

    getNorthEast(): LngLat;

    getSouthWest(): LngLat;
  }

  export class Map {
    constructor(options: MapOptions);

    addControl(control: NavigationControl, position?: ControlPosition): this;

    on(type: "click", listener: (event: MapMouseEvent) => void): this;

    on(type: "load", listener: () => void): this;

    flyTo(options: FlyToOptions): this;

    fitBounds(
      bounds: LngLatBounds | [[number, number], [number, number]],
      options?: FitBoundsOptions,
    ): this;

    resize(): this;

    remove(): void;
  }

  export type MarkerAnchor =
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

  export interface MarkerOptions {
    draggable?: boolean;
    color?: string;
    element?: HTMLElement;
    anchor?: MarkerAnchor;
  }

  export interface PopupOptions {
    closeButton?: boolean;
    closeOnClick?: boolean;
    className?: string;
    offset?: number;
  }

  export class Popup {
    constructor(options?: PopupOptions);

    setText(text: string): this;

    setHTML(html: string): this;

    setDOMContent(element: Node): this;

    setLngLat(coordinates: LngLatLike): this;

    addTo(map: Map): this;

    remove(): void;
  }

  export class Marker {
    constructor(options?: MarkerOptions);

    setLngLat(lngLat: LngLatLike): this;

    getLngLat(): LngLat;

    addTo(map: Map): this;

    setPopup(popup: Popup): this;

    getPopup(): Popup | undefined;

    togglePopup(): this;

    getElement(): HTMLElement;

    on(type: "dragend", listener: () => void): this;

    remove(): void;
  }

  const goongjs: {
    accessToken: string;

    Map: typeof Map;

    Marker: typeof Marker;

    Popup: typeof Popup;

    LngLatBounds: typeof LngLatBounds;

    NavigationControl: typeof NavigationControl;
  };

  export default goongjs;
}
