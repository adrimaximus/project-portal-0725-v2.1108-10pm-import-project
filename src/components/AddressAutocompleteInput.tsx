import React, { useEffect, useState, useMemo } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const libraries: ('places')[] = ['places'];

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ value, onChange, disabled }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const displayValue = useMemo(() => {
    if (!value) return '';
    try {
      const parsed = JSON.parse(value);
      if (parsed.name && parsed.address) {
        return `${parsed.name} - ${parsed.address}`;
      }
      return value;
    } catch (e) {
      return value;
    }
  }, [value]);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const name = place.name || '';
      const address = place.formatted_address || '';
      if (name && address) {
        const venueObject = { name, address };
        onChange(JSON.stringify(venueObject));
      } else {
        onChange(address || name || '');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  if (loadError) {
    toast.error("Failed to load Google Maps script.");
    return <Input placeholder="Error loading maps" disabled />;
  }

  if (!isLoaded) {
    return <Skeleton className="h-10 w-full" />;
  }

  let fullQuery = value || '';
  try {
    const parsed = JSON.parse(value || '{}');
    if (parsed.name && parsed.address) {
      fullQuery = `${parsed.name}, ${parsed.address}`;
    }
  } catch (e) {
    // Not a JSON string, use as is
  }

  return (
    <div className="relative w-full">
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          fields: ["formatted_address", "name", "geometry"],
        }}
      >
        <Input
          type="text"
          placeholder="Start typing an address..."
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          className="pr-10"
        />
      </Autocomplete>
      {value && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Get directions"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MapPin className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};

export default AddressAutocompleteInput;