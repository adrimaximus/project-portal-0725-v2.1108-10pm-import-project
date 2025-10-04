import React, { useEffect, useRef, useMemo } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const libraries: ("places")[] = ["places"];

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = useMemo(() => {
    if (!value) return "";
    try {
      const parsed = JSON.parse(value);
      if (parsed.name && parsed.address) {
        if (parsed.name.toLowerCase() === parsed.address.toLowerCase()) return parsed.name;
        return `${parsed.name} - ${parsed.address}`;
      }
      return value;
    } catch {
      return value;
    }
  }, [value]);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocompleteInstance;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place) {
        const name = place.name || "";
        const address = place.formatted_address || "";
        const type =
          place.types && place.types.length > 0
            ? place.types[0].replace(/_/g, " ")
            : "";
        const venueObject = { name, address, type };
        onChange(JSON.stringify(venueObject));
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

  let fullQuery = value || "";
  try {
    const parsed = JSON.parse(value || "{}");
    if (parsed.name && parsed.address) {
      fullQuery = `${parsed.name}, ${parsed.address}`;
    }
  } catch {
    // Not JSON, use as is
  }

  return (
    <div className="relative w-full">
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{ fields: ["formatted_address", "name", "geometry", "types"] }}
      >
        <Input
          ref={inputRef}
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
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            fullQuery
          )}`}
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