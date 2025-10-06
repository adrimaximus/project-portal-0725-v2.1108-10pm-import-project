import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";

const libraries: ("places")[] = ["places"];

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const AddressAutocompleteInput: React.FC<Props> = ({ value, onChange, disabled, placeholder }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded) {
      setService(new window.google.maps.places.AutocompleteService());
      setPlacesService(new window.google.maps.places.PlacesService(document.createElement("div")));
    }
  }, [isLoaded]);

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        const display = `${parsed.name ?? ""}${parsed.type ? " - " + parsed.type : ""}${parsed.address ? " - " + parsed.address : ""}`;
        setInputValue(display);
      } catch {
        setInputValue(value);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (service && query.length > 1) {
      service.getPlacePredictions(
        { input: query, componentRestrictions: { country: "id" } },
        (res) => setPredictions(res || [])
      );
    } else {
      setPredictions([]);
    }
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;
    setPredictions([]);
    setInputValue(prediction.description);

    placesService.getDetails(
      { placeId: prediction.place_id, fields: ["name", "formatted_address", "geometry", "types"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const name = place.name || "";
          const address = place.formatted_address || "";
          const type =
            place.types && place.types.length > 0 ? place.types[0].replace(/_/g, " ") : "";

          const venue = { name, type, address };
          onChange(JSON.stringify(venue));
          setInputValue(`${name}${type ? " - " + type : ""} - ${address}`);
        }
      }
    );
  };

  // close list if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setPredictions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div ref={containerRef} className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder || "Search address..."}
        className="pr-10"
      />

      {predictions.length > 0 && (
        <ul className="absolute z-[999999] mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((p) => (
            <li
              key={p.place_id}
              className="cursor-pointer px-3 py-2 hover:bg-accent text-sm"
              onClick={() => handleSelect(p)}
            >
              <strong>{p.structured_formatting.main_text}</strong>{" "}
              <span className="text-muted-foreground">{p.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}

      {value && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`}
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