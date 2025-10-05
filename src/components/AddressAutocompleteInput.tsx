import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [inputValue, setInputValue] = useState("");

  // Sync value from parent
  useEffect(() => {
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
  }, [value]);

  // Initialize Autocomplete when Maps script is ready
  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["formatted_address", "name", "geometry", "types"],
          componentRestrictions: { country: "id" }, // limit ke Indonesia
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place || !place.formatted_address) return;

        const name = place.name || "";
        const address = place.formatted_address || "";
        const type =
          place.types && place.types.length > 0
            ? place.types[0].replace(/_/g, " ")
            : "";

        const venueObject = { name, type, address };
        const display = `${name}${type ? " - " + type : ""} - ${address}`;

        setInputValue(display);
        onChange(JSON.stringify(venueObject));
      });
    }
  }, [isLoaded, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
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
      <Input
        ref={inputRef}
        type="text"
        placeholder="Start typing an address..."
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        className="pr-10"
      />
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