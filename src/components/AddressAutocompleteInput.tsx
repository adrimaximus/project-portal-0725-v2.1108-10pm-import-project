import React, { useEffect, useState } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';

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
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setInputValue(parsed.name || value);
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
        setInputValue(name);
      } else {
        const plainValue = address || name;
        onChange(plainValue);
        setInputValue(plainValue);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    let storedName = '';
    try {
      storedName = JSON.parse(value).name;
    } catch (e) {
      storedName = value;
    }
    if (inputValue !== storedName) {
      onChange(inputValue);
    }
  };

  if (loadError) {
    toast.error("Failed to load Google Maps script.");
    return <Input placeholder="Error loading maps" disabled />;
  }

  if (!isLoaded) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
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
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
      />
    </Autocomplete>
  );
};

export default AddressAutocompleteInput;