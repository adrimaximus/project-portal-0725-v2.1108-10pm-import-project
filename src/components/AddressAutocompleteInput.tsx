import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "./ui/skeleton";

interface AddressAutocompleteInputProps {
  value?: string;
  onChange?: (value: string) => void;
  countryCode?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const libraries: ("places")[] = ["places"];

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  value = "",
  onChange,
  countryCode = "id",
  placeholder = "Search location...",
  disabled,
  className,
}) => {
  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [showPredictions, setShowPredictions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && !service) {
      setService(new window.google.maps.places.AutocompleteService());
    }
  }, [isLoaded, service]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (service && query.length > 2) {
      service.getPlacePredictions(
        { input: query, componentRestrictions: { country: countryCode } },
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
    setInputValue(prediction.description);
    setShowPredictions(false);
    if (onChange) {
      onChange(prediction.description);
    }
  };

  if (loadError) {
    return <Input type="text" disabled value="Error loading Google Maps" className={className} />;
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
        placeholder={placeholder}
        className={className}
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
    </div>
  );
};

export default AddressAutocompleteInput;