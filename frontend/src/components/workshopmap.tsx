"use client";

import { useMap } from "react-leaflet";
import { MapPin, Navigation } from "lucide-react";
import type { LatLngExpression } from "leaflet";

import {
  Map,
  MapControlContainer,
  MapMarker,
  MapPopup,
  MapTileLayer,
  MapZoomControl,
} from "@/components/ui/map";

import { Button } from "@/components/ui/button";

export type WorkshopLocation = {
  id: string | number;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  image?: string;
  price?: number;
};

type WorkshopMapProps = {
  currentWorkshop: WorkshopLocation;
  nearbyWorkshops: WorkshopLocation[];
  className?: string;
  onWorkshopClick?: (workshop: WorkshopLocation) => void;
};

function RecenterButton({
  position,
}: {
  position: LatLngExpression;
}) {
  const map = useMap();

  const handleRecenter = () => {
    map.flyTo(position, 15, {
      duration: 0.8,
    });
  };

  return (
    <MapControlContainer className="absolute bottom-3 right-3 z-1000">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleRecenter}
        className="gap-2 bg-white shadow-md hover:bg-neutral-100"
      >
        <Navigation className="h-4 w-4" />
        Quay về workshop
      </Button>
    </MapControlContainer>
  );
}

function FlyToWorkshop({
  workshop,
  onClick,
}: {
  workshop: WorkshopLocation;
  onClick?: (workshop: WorkshopLocation) => void;
}) {
  const map = useMap();

  const handleClick = () => {
    map.flyTo([workshop.latitude, workshop.longitude], 16, {
      duration: 0.8,
    });

    onClick?.(workshop);
  };

  return (
    <MapMarker
      position={[workshop.latitude, workshop.longitude]}
      eventHandlers={{
        click: handleClick,
      }}
      icon={
        <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-neutral-900 text-white shadow-md">
          <MapPin className="h-5 w-5" />
        </div>
      }
      iconAnchor={[18, 36]}
      popupAnchor={[0, -36]}
    >
      <MapPopup>
        <div className="w-56">
          {workshop.image && (
            <img
              src={workshop.image}
              alt={workshop.title}
              className="aspect-video w-full rounded-lg object-cover"
            />
          )}

          <h3 className="mt-2 font-semibold text-neutral-950">
            {workshop.title}
          </h3>

          <p className="mt-1 text-xs text-neutral-500">
            {workshop.address}
          </p>

          {workshop.price !== undefined && (
            <p className="mt-2 text-sm font-medium">
              {workshop.price.toLocaleString("vi-VN")}₫ / người
            </p>
          )}
        </div>
      </MapPopup>
    </MapMarker>
  );
}

export default function WorkshopMap({
  currentWorkshop,
  nearbyWorkshops,
  className = "",
  onWorkshopClick,
}: WorkshopMapProps) {
  const currentPosition: LatLngExpression = [
    currentWorkshop.latitude,
    currentWorkshop.longitude,
  ];

  const filteredNearbyWorkshops = nearbyWorkshops.filter(
    (workshop) => workshop.id !== currentWorkshop.id,
  );

  return (
    <section
      className={[
        "relative h-[420px] w-full overflow-hidden rounded-2xl",
        className,
      ].join(" ")}
    >
      <Map
        center={currentPosition}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <MapTileLayer />

        <MapZoomControl position="top-3 left-3" />

        {/* Workshop hiện tại */}
        <MapMarker
          position={currentPosition}
          icon={
            <div className="relative grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-red-500 text-white shadow-lg">
              <MapPin className="h-6 w-6" />

              <span className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-red-500" />
            </div>
          }
          iconAnchor={[24, 48]}
          popupAnchor={[0, -48]}
        >
          <MapPopup>
            <div className="w-60">
              {currentWorkshop.image && (
                <img
                  src={currentWorkshop.image}
                  alt={currentWorkshop.title}
                  className="aspect-video w-full rounded-lg object-cover"
                />
              )}

              <div className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                Workshop hiện tại
              </div>

              <h3 className="mt-2 font-semibold text-neutral-950">
                {currentWorkshop.title}
              </h3>

              <p className="mt-1 text-xs text-neutral-500">
                {currentWorkshop.address}
              </p>

              {currentWorkshop.price !== undefined && (
                <p className="mt-2 text-sm font-medium">
                  {currentWorkshop.price.toLocaleString("vi-VN")}₫ / người
                </p>
              )}
            </div>
          </MapPopup>
        </MapMarker>

        {/* Workshop lân cận */}
        {filteredNearbyWorkshops.map((workshop) => (
          <FlyToWorkshop
            key={workshop.id}
            workshop={workshop}
            onClick={onWorkshopClick}
          />
        ))}

        <RecenterButton position={currentPosition} />
      </Map>
    </section>
  );
}