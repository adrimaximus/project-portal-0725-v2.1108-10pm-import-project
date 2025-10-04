import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({ value, onChange, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (window.google && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["name", "formatted_address"],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place) {
          let displayValue = place.formatted_address;
          if (place.name && place.formatted_address && !place.formatted_address.toLowerCase().includes(place.name.toLowerCase())) {
            displayValue = `${place.name} - ${place.formatted_address}`;
          }
          onChange(displayValue || '');
        }
      });
    }
  }, [onChange]);

  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder || "Cari nama tempat atau alamat..."}
      defaultValue={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default GooglePlacesAutocomplete;