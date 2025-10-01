import React, { useEffect, useState } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Input } from './ui/input';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string) => void;
  disabled?: boolean;
}

const AutocompleteCore = ({ apiKey, value, onChange, disabled }: { apiKey: string, value: string, onChange: (address: string) => void, disabled?: boolean }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
    preventGoogleFontsLoading: true,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.name && parsed.address) {
          setInputValue(`${parsed.name}, ${parsed.address}`);
        } else {
          setInputValue(value);
        }
      } catch (e) {
        setInputValue(value);
      }
    } else {
      setInputValue('');
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
        setInputValue(`${name}, ${address}`);
      } else {
        const plainValue = address || name;
        onChange(plainValue);
        setInputValue(plainValue);
      }
    } else {
      console.error('Autocomplete is not loaded yet!');
    }
  };

  if (loadError) {
    console.error("Google Maps API Load Error:", loadError);
    toast.error("Failed to load Google Maps script. Please check your API key and internet connection.");
    return <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="Error loading maps, enter address manually" />;
  }

  if (!isLoaded) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ["establishment", "geocode"],
        componentRestrictions: { country: "id" },
        fields: ["formatted_address", "name"],
      }}
    >
      <Input
        type="text"
        placeholder="Start typing an address..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        disabled={disabled}
      />
    </Autocomplete>
  );
};

const AddressAutocompleteInput = ({ value, onChange, disabled }: AddressAutocompleteInputProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);

  useEffect(() => {
    const fetchKey = async () => {
      setLoadingKey(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          throw new Error("API key was not returned from the function.");
        }
      } catch (error: any) {
        console.error("Failed to fetch Google Maps API key:", error.message);
        toast.error("Could not fetch Google Maps API key.");
      } finally {
        setLoadingKey(false);
      }
    };
    fetchKey();
  }, []);

  if (loadingKey) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!apiKey) {
    return <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="API key missing, enter address manually" />;
  }

  return <AutocompleteCore apiKey={apiKey} value={value} onChange={onChange} disabled={disabled} />;
};

export default AddressAutocompleteInput;