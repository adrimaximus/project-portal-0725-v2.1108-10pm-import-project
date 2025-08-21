import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const libraries: ("places")[] = ['places'];

interface AddressAutocompleteInputProps {
  value: any; // Can be a string (initial) or the address object
  onChange: (address: any) => void;
}

const AddressAutocompleteInput = ({ value, onChange }: AddressAutocompleteInputProps) => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  const [inputValue, setInputValue] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (value) {
      setInputValue(value.formatted_address || value || '');
    } else {
      setInputValue('');
    }
  }, [value]);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        const addressComponents = place.address_components?.reduce((acc, component) => {
          const type = component.types[0];
          acc[type] = component.long_name;
          return acc;
        }, {} as Record<string, string>);

        const structuredAddress = {
          formatted_address: place.formatted_address,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          ...addressComponents,
        };
        onChange(structuredAddress);
      }
    }
  };

  if (!googleMapsApiKey) {
    return <div className="text-destructive text-sm p-2 bg-destructive/10 rounded-md">Google Maps API Key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY.</div>;
  }

  if (loadError) {
    return <div className="text-destructive text-sm">Error loading Google Maps. Please check your API key and configuration.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading map...</span>
      </div>
    );
  }

  return (
    <Autocomplete
      onLoad={(autocomplete) => {
        autocompleteRef.current = autocomplete;
      }}
      onPlaceChanged={handlePlaceChanged}
      fields={['address_components', 'geometry', 'formatted_address']}
    >
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Start typing an address..."
      />
    </Autocomplete>
  );
};

export default AddressAutocompleteInput;