import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

const libraries: ("places")[] = ["places"];

interface Props {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const AddressAutocompleteInput: React.FC<Props> = ({ value = "", onChange, disabled, className }) => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries,
    preventGoogleFontsLoading: true,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        const display = `${parsed.name ?? ""}${parsed.type ? " - " + parsed.type : ""}${parsed.address ? " - " + parsed.address : ""}`.trim();
        setInputValue(display);
      } catch {
        setInputValue(value);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        const name = place.name || "";
        const address = place.formatted_address || "";
        const type = place.types && place.types.length > 0 ? place.types[0].replace(/_/g, " ") : "";

        const venue = { name, type, address };
        onChange(JSON.stringify(venue));
        setInputValue(address);
      }
    } else {
      console.error("Autocomplete is not loaded yet!");
    }
  };

  if (!googleMapsApiKey) {
    return <Input type="text" disabled value="Google Maps API Key is missing" className={className} />;
  }

  if (loadError) {
    toast.error("Failed to load Google Maps script.");
    return <Input placeholder="Error loading maps" disabled className={className} />;
  }

  if (!isLoaded) {
    return <Skeleton className={`h-10 w-full ${className}`} />;
  }

  return (
    <div className="relative w-full">
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: "id" },
          fields: ["name", "formatted_address", "geometry", "types"],
        }}
      >
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled}
          placeholder="Search address..."
          className={`pr-10 ${className}`}
        />
      </Autocomplete>
      {value && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputValue)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Google Maps"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <MapPin className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};

export default AddressAutocompleteInput;