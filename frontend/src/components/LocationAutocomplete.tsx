import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { workshopService } from '@/services/workshopService';
import type { GoongPlacePrediction } from '@/types/workshop';

export type StructuredLocation = {
  ward: string;
  district: string;
  city: string;
  formattedAddress: string;
  lat: number;
  lng: number;
};

type Props = {
  onSelectLocation: (location: StructuredLocation | null) => void;
  defaultValue?: string;
  className?: string;
};

export default function LocationAutocomplete({ onSelectLocation, defaultValue = '', className = '' }: Props) {
  const [input, setInput] = useState(defaultValue);
  const [predictions, setPredictions] = useState<GoongPlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setPredictions([]);
      return;
    }
    
    // Don't search if the input matches defaultValue perfectly at mount (it's already selected)
    // but we can't reliably detect that, so just debounce search.
    const timeout = setTimeout(async () => {
      try {
        
        const results = await workshopService.searchPlaces(input);
        setPredictions(results || []);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [input]);

  const handleSelect = async (place: GoongPlacePrediction) => {
    setInput(place.description);
    setIsOpen(false);
    
    try {
      const detail = await workshopService.getPlaceDetail(place.place_id);
      if (detail) {
        const lat = detail.geometry.location.lat;
        const lng = detail.geometry.location.lng;
        let ward = '';
        let district = '';
        let city = '';
        
        const parts = detail.formatted_address.split(',').map(p => p.trim());
        if (parts.length > 0) {
          // Goong formatted_address usually ends with City/Province, then Country if present.
          // But often it's just "..., District, City".
          // Let's grab the last 3 parts.
          const isVietnam = parts[parts.length - 1].toLowerCase() === 'việt nam' || parts[parts.length - 1].toLowerCase() === 'vietnam';
          const maxIdx = isVietnam ? parts.length - 2 : parts.length - 1;
          
          if (maxIdx >= 0) city = parts[maxIdx];
          if (maxIdx - 1 >= 0) district = parts[maxIdx - 1];
          if (maxIdx - 2 >= 0) ward = parts[maxIdx - 2];
        }

        onSelectLocation({
          formattedAddress: detail.formatted_address,
          ward,
          district,
          city,
          lat,
          lng
        });
      }
    } catch (error) {
      console.error('Failed to get place detail', error);
    }
  };

  const clearLocation = () => {
    setInput('');
    onSelectLocation(null);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}> 
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => { if (predictions.length > 0) setIsOpen(true) }}
          placeholder="Tìm địa điểm (Quận 1, Hà Nội...)"
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {input && (
          <button type="button" onClick={clearLocation} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            &times;
          </button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {predictions.map((p) => (
            <li 
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin className="mr-2 size-4 opacity-50" />
              <span className="truncate">{p.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
