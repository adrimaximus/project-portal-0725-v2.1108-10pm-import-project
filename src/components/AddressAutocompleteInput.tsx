import React, { useEffect, useState, useRef } from "react";
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

  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused) {
      return; // Don't update from prop while user is typing
    }
    if (value) {
      try {
        const parsed = JSON.parse(value);
        const display = `${parsed.name ?? ""}${
          parsed.type ? " - " + parsed.type : ""
        }${parsed.address ? " - " + parsed.address : ""}`;
        setInputValue(display);
      } catch {
        setInputValue(value);
      }
    } else {
      setInputValue("");
    }
  }, [value, isFocused]);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const name = place.name || "";
      const address = place.formatted_address || "";
      const type =
        place.types && place.types.length > 0
          ? place.types[0].replace(/_/g, " ")
          : "";

      if (name && address) {
        const venueObject = { name, type, address };
        const display = `${name}${type ? " - " + type : ""} - ${address}`;
        onChange(JSON.stringify(venueObject));
        setInputValue(display);
      } else {
        const plainValue = address || name || inputRef.current?.value || '';
        onChange(JSON.stringify({ name: plainValue, address: plainValue }));
        setInputValue(plainValue);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Use a timeout to allow onPlaceChanged to fire first if user clicks a suggestion
    setTimeout(() => {
        try {
            // If value is already valid JSON, do nothing
            JSON.parse(value);
        } catch {
            // If not, it means user typed text without selecting.
            // So, we format and update the parent state.
            if (inputValue.trim()) {
                onChange(
                JSON.stringify({ name: inputValue, address: inputValue })
                );
            } else if (value) {
                // If input is cleared, clear parent state
                onChange('');
            }
        }
    }, 200);
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
        options={{
          fields: ["formatted_address", "name", "geometry", "types"],
        }}
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder="Start typing an address..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
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