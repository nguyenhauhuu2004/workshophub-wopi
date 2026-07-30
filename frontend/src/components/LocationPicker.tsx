import { useEffect, useRef, useState } from "react";

import "@goongmaps/goong-js/dist/goong-js.css";

import goongjs, {
  type Map as GoongMap,
  type Marker as GoongMarker,
} from "@goongmaps/goong-js";

import { Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workshopService } from "@/services/workshopService";

import type {
  WorkshopLocationForm,
  GoongPlacePrediction,
} from "@/types/workshop";

type LocationPickerProps = {
  value: WorkshopLocationForm;
  onChange: (value: WorkshopLocationForm) => void;
};

const DEFAULT_LONGITUDE = 106.6297;
const DEFAULT_LATITUDE = 10.8231;

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<GoongMap | null>(null);

  const markerRef = useRef<GoongMarker | null>(null);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  const [query, setQuery] = useState(value.address);

  const [results, setResults] = useState<GoongPlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  const updateValue = (nextValue: WorkshopLocationForm) => {
    valueRef.current = nextValue;
    onChangeRef.current(nextValue);
  };

  const setMarker = (longitude: number, latitude: number) => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new goongjs.Marker({
        draggable: true,
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current.on("dragend", () => {
        const position = markerRef.current?.getLngLat();

        if (!position) {
          return;
        }

        void selectCoordinates(position.lat, position.lng);
      });
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }

    map.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      essential: true,
    });
  };

  const selectCoordinates = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);

      const result = await workshopService.reverseGeocode(latitude, longitude);

      const address = result?.formatted_address ?? `${latitude}, ${longitude}`;

      const nextValue: WorkshopLocationForm = {
        ...valueRef.current,
        address,
        placeId: result?.place_id ?? "",
        coordinates: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };

      setQuery(address);
      setResults([]);
      updateValue(nextValue);
      setMarker(longitude, latitude);
    } catch (error) {
      console.error("Reverse geocode error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container) {
      return;
    }

    const accessToken = import.meta.env.VITE_GOONG_MAPTILES_KEY;

    if (!accessToken) {
      console.error("Thiếu VITE_GOONG_MAPTILES_KEY");

      return;
    }

    goongjs.accessToken = accessToken;

    const [selectedLongitude, selectedLatitude] =
      valueRef.current.coordinates.coordinates;

    const longitude = selectedLongitude ?? DEFAULT_LONGITUDE;

    const latitude = selectedLatitude ?? DEFAULT_LATITUDE;

    const hasCoordinates =
      selectedLongitude !== null && selectedLatitude !== null;

    const map = new goongjs.Map({
      container,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [longitude, latitude],
      zoom: hasCoordinates ? 16 : 11,
    });

    map.addControl(new goongjs.NavigationControl(), "top-right");

    map.on("click", (event) => {
      void selectCoordinates(event.lngLat.lat, event.lngLat.lng);
    });

    mapRef.current = map;

    if (selectedLongitude !== null && selectedLatitude !== null) {
      setMarker(selectedLongitude, selectedLatitude);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const text = query.trim();

    if (text.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);

        const [longitude, latitude] = valueRef.current.coordinates.coordinates;

        const location =
          longitude !== null && latitude !== null
            ? `${latitude},${longitude}`
            : undefined;

        const predictions = await workshopService.searchPlaces(text, location);

        setResults(predictions);
      } catch (error) {
        console.error("Search places error:", error);

        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  const selectPlace = async (prediction: GoongPlacePrediction) => {
    try {
      setLoading(true);

      const detail = await workshopService.getPlaceDetail(prediction.place_id);

      const coordinates = detail?.geometry?.location;

      if (!coordinates) {
        return;
      }

      const nextValue: WorkshopLocationForm = {
        ...valueRef.current,

        address: detail.formatted_address ?? prediction.description,

        placeId: detail.place_id ?? prediction.place_id,

        coordinates: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat],
        },
      };

      setQuery(nextValue.address);
      setResults([]);
      updateValue(nextValue);

      setMarker(coordinates.lng, coordinates.lat);
    } catch (error) {
      console.error("Get place detail error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={query}
          autoComplete="off"
          placeholder="Nhập địa chỉ workshop"
          className="pl-9 pr-10"
          onChange={(event) => {
            const address = event.target.value;

            const nextValue: WorkshopLocationForm = {
              ...valueRef.current,
              address,
            };

            setQuery(address);
            updateValue(nextValue);
          }}
        />

        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
        )}

        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-auto rounded-xl border bg-background p-1 shadow-xl">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => void selectPlace(result)}
                className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-accent"
              >
                {result.description}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="h-[360px] w-full overflow-hidden rounded-2xl border"
      />

      <Textarea
        rows={3}
        value={value.notes}
        placeholder="Ghi chú đường đi, tầng, chỗ gửi xe..."
        onChange={(event) => {
          const nextValue: WorkshopLocationForm = {
            ...valueRef.current,
            notes: event.target.value,
          };

          updateValue(nextValue);
        }}
      />
    </div>
  );
};

export default LocationPicker;
