import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
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

  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showPredictions, setShowPredictions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !service) {
      setService(new window.google.maps.places.AutocompleteService());
      setPlacesService(new window.google.maps.places.PlacesService(document.createElement("div")));
    }
  }, [isLoaded, service]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (service && query.length > 2) {
      service.getPlacePredictions(
        { input: query, componentRestrictions: { country: "id" } },
        (res) => {
          setPredictions(res || []);
          if (res && res.length > 0) {
            setShowPredictions(true);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;
    setShowPredictions(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div ref={containerRef} className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleChange}
        disabled={disabled}
        placeholder="Search address..."
        className={`pr-10 ${className}`}
        autoComplete="off"
      />

      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full mt-2 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
          <Command>
            <CommandList>
              <CommandGroup>
                {predictions.map((p) => (
                  <CommandItem
                    key={p.place_id}
                    onSelect={() => handleSelect(p)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(p);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <strong>{p.structured_formatting.main_text}</strong>
                      <span className="text-xs text-muted-foreground">
                        {p.structured_formatting.secondary_text}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

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