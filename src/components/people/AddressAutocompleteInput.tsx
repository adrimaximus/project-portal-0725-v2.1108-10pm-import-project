import React, { useEffect, useState } from 'react';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface AddressAutocompleteInputProps {
  value: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

// Komponen ini hanya akan dirender setelah kunci API tersedia.
const AutocompleteCore = ({ apiKey, value, onChange, disabled }: { apiKey: string, value: any, onChange: (address: any) => void, disabled?: boolean }) => {
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

  const getDisplayLabel = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) {
      return val.label || val.formatted_address;
    }
    return undefined;
  };

  const displayLabel = getDisplayLabel(value);
  const formattedValue = displayLabel ? { label: displayLabel, value: displayLabel } : null;

  return (
    <GooglePlacesAutocomplete
      apiKey={apiKey}
      apiOptions={{ language: 'id', region: 'id' }}
      selectProps={{
        value: formattedValue,
        onChange: handleSelect,
        isDisabled: disabled,
        placeholder: 'Mulai ketik alamat...',
        styles: {
          control: (provided) => ({
            ...provided,
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            minHeight: '40px',
            boxShadow: 'none',
            '&:hover': {
              borderColor: 'hsl(var(--input))',
            },
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
            backgroundColor: 'hsl(var(--background))',
            zIndex: 50,
          }),
        },
      }}
    />
  );
};

const AddressAutocompleteInput = ({ value, onChange, disabled }: AddressAutocompleteInputProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          throw new Error("Kunci API tidak dikembalikan dari fungsi.");
        }
      } catch (error: any) {
        console.error("Gagal mengambil kunci API Google Maps:", error.message);
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
    return (
      <div className="p-3 text-center text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
        Kunci API Google Maps tidak dikonfigurasi di server. Silakan hubungi administrator.
      </div>
    );
  }

  return <AutocompleteCore apiKey={apiKey} value={value} onChange={onChange} disabled={disabled} />;
};

export default AddressAutocompleteInput;