import React, { useEffect } from 'react';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { toast } from 'sonner';
import { useJsApiLoader } from '@react-google-maps/api';
import { Skeleton } from '../ui/skeleton';

interface AddressAutocompleteInputProps {
  value: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

const AddressAutocompleteInput = ({ value, onChange, disabled }: AddressAutocompleteInputProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.error("AddressAutocomplete: VITE_GOOGLE_MAPS_API_KEY is not set in the environment variables.");
    }
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="p-3 text-center text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
        Kunci API Google Maps tidak dikonfigurasi. Silakan tambahkan VITE_GOOGLE_MAPS_API_KEY ke file .env Anda dan <strong>Rebuild</strong> aplikasi.
      </div>
    );
  }
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  useEffect(() => {
    if (loadError) {
      console.error("Google Maps API Load Error:", loadError);
      toast.error("Gagal memuat Google Maps API.", {
        description: "Silakan periksa konsol developer untuk detail kesalahan.",
      });
    }
  }, [loadError]);

  if (loadError) {
    return (
      <div className="p-3 text-center text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
        Gagal memuat skrip Google Maps. Silakan periksa kunci API Anda dan koneksi internet. Pastikan API yang diperlukan diaktifkan di Google Cloud Console.
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleSelect = async (place: any) => {
    if (!place) {
      onChange(null);
      return;
    }

    try {
      const results = await geocodeByAddress(place.label);
      const latLng = await getLatLng(results[0]);
      const components = results[0].address_components;

      const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || '';

      const structuredAddress = {
        label: place.label,
        place_id: results[0].place_id,
        formatted_address: results[0].formatted_address,
        lat: latLng.lat,
        lng: latLng.lng,
        street: [get('route'), get('street_number')].filter(Boolean).join(' '),
        suburb: get('sublocality') || get('sublocality_level_1'),
        city: get('locality') || get('administrative_area_level_2'),
        province: get('administrative_area_level_1'),
        postal_code: get('postal_code'),
        country: get('country'),
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