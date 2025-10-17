import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "./ui/skeleton";
import { supabase } from '@/integrations/supabase/client';

const libraries: ("places")[] = ["places"];

interface AutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const Autocomplete: React.FC<AutocompleteProps> = ({ value = "", onChange, placeholder, disabled, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showPredictions, setShowPredictions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        const display = `${parsed.name ?? ""}${parsed.address ? ` - ${parsed.address}` : ""}`.trim();
        setInputValue(display);
      } catch {
        setInputValue(value);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  useEffect(() => {
    if (window.google && !service) {
      setService(new window.google.maps.places.AutocompleteService());
      setPlacesService(new window.google.maps.places.PlacesService(document.createElement("div")));
    }
    if (window.google && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["name", "formatted_address", "geometry", "types"],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place) {
          const name = place.name || "";
          const address = place.formatted_address || "";
          const type = place.types && place.types.length > 0 ? place.types[0].replace(/_/g, " ") : "";
          const displayValue = `${name}${address ? ` - ${address}` : ''}`;
          
          onChange(JSON.stringify({ name, type, address }));
          setInputValue(displayValue);
          setShowPredictions(false);
        }
      });
    }
  }, [service, onChange]);

  const fetchPredictions = (query: string) => {
    if (service && query.length > 2) {
      service.getPlacePredictions({ input: query }, (res, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && res) {
          setPredictions(res);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    fetchPredictions(query);
  };

  const handleFocus = () => {
    if (inputValue.length > 2) {
      fetchPredictions(inputValue);
    }
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;
    setShowPredictions(false);
    setInputValue(prediction.description);

    placesService.getDetails({ placeId: prediction.place_id, fields: ["name", "formatted_address", "geometry", "types"] }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const name = place.name || "";
        const address = place.formatted_address || "";
        const type = place.types && place.types.length > 0 ? place.types[0].replace(/_/g, " ") : "";
        const displayValue = `${name}${address ? ` - ${address}` : ''}`;
        onChange(JSON.stringify({ name, type, address }));
        setInputValue(displayValue);
      }
    });
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

  return (
    <div ref={containerRef} className="relative w-full">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => onChange(inputValue)} // Pass raw value on blur if no selection is made
        disabled={disabled}
        placeholder={placeholder || "Search address..."}
        className={`pl-10 pr-10 ${className}`}
        autoComplete="off"
      />
      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full mt-2 z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
          <Command>
            <CommandList>
              <CommandGroup>
                {predictions.map((p) => (
                  <CommandItem key={p.place_id} onSelect={() => handleSelect(p)} onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }} className="cursor-pointer">
                    <div className="flex flex-col">
                      <strong>{p.structured_formatting.main_text}</strong>
                      <span className="text-xs text-muted-foreground">{p.structured_formatting.secondary_text}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
      {value && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputValue)}`} target="_blank" rel="noopener noreferrer" title="Open in Google Maps" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <MapPin className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};

const LoadedAutocomplete: React.FC<AutocompleteProps & { apiKey: string }> = (props) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: props.apiKey,
    libraries,
    preventGoogleFontsLoading: true,
    id: 'google-maps-script',
  });

  if (loadError) {
    toast.error("Failed to load Google Maps script.");
    return <Input placeholder="Error loading maps" disabled className={props.className} />;
  }

  if (!isLoaded) {
    return <Skeleton className={`h-10 w-full ${props.className}`} />;
  }

  return <Autocomplete {...props} />;
};

const AddressAutocompleteInput: React.FC<AutocompleteProps> = (props) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        if (data.apiKey) {
          setGoogleMapsApiKey(data.apiKey);
        } else {
          throw new Error("API key not returned from function.");
        }
      } catch (error: any) {
        console.error("Failed to fetch Google Maps API key:", error.message);
        toast.error("Could not load map service.", { description: "API key configuration is missing." });
      } finally {
        setKeyLoading(false);
      }
    };
    fetchKey();
  }, []);

  if (keyLoading) {
    return <Skeleton className={`h-10 w-full ${props.className}`} />;
  }

  if (!googleMapsApiKey) {
    return <Input type="text" disabled value="Google Maps API Key is missing" className={props.className} />;
  }

  return <LoadedAutocomplete {...props} apiKey={googleMapsApiKey} />;
};

export default AddressAutocompleteInput;