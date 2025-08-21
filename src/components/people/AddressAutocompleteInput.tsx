import React from 'react';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { toast } from 'sonner';

interface AddressAutocompleteInputProps {
  value: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

const AddressAutocompleteInput = ({ value, onChange, disabled }: AddressAutocompleteInputProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-100 border border-red-200 rounded-md">
        Google Maps API Key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.
      </div>
    );
  }

  const handleSelect = async (place: any) => {
    if (!place) {
      onChange(null);
      return;
    }

    try {
      const results = await geocodeByAddress(place.label);
      const latLng = await getLatLng(results[0]);

      const addressComponents = results[0].address_components.reduce((acc, component) => {
        const type = component.types[0];
        acc[type] = component.long_name;
        return acc;
      }, {} as Record<string, string>);

      const structuredAddress = {
        label: place.label,
        formatted_address: results[0].formatted_address,
        lat: latLng.lat,
        lng: latLng.lng,
        ...addressComponents,
      };
      onChange(structuredAddress);
    } catch (error) {
      console.error("Error getting address details:", error);
      toast.error("Could not fetch address details.");
      onChange({ label: place.label, formatted_address: place.label });
    }
  };

  const formattedValue = value && value.label ? value : value ? { label: value.formatted_address || value } : null;

  return (
    <GooglePlacesAutocomplete
      apiKey={apiKey}
      selectProps={{
        value: formattedValue,
        onChange: handleSelect,
        isDisabled: disabled,
        placeholder: 'Start typing an address...',
        styles: {
          control: (provided) => ({
            ...provided,
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            minHeight: '40px',
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
          menu: (provided) => ({
            ...provided,
            zIndex: 50,
          }),
        },
      }}
    />
  );
};

export default AddressAutocompleteInput;