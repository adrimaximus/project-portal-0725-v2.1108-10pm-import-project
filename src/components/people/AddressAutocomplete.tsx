import React from 'react';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';

interface AddressAutocompleteProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const AddressAutocomplete = ({ value, onChange, disabled }: AddressAutocompleteProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-100 border border-red-200 rounded-md">
        Google Maps API Key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.
      </div>
    );
  }

  return (
    <GooglePlacesAutocomplete
      apiKey={apiKey}
      selectProps={{
        value,
        onChange,
        isDisabled: disabled,
        placeholder: 'Start typing an address...',
        styles: {
          control: (provided) => ({
            ...provided,
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
          }),
          input: (provided) => ({
            ...provided,
            color: 'hsl(var(--foreground))',
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
          }),
          singleValue: (provided) => ({
            ...provided,
            color: 'hsl(var(--foreground))',
          }),
        },
      }}
    />
  );
};

export default AddressAutocomplete;