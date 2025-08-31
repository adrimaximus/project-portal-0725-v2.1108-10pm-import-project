import React, { useEffect, useState } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '../ui/input';

interface AddressAutocompleteInputProps {
  value: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

// Komponen ini hanya akan dirender setelah kunci API tersedia.
const AutocompleteCore = ({ apiKey, value, onChange, disabled }: { apiKey: string, value: any, onChange: (address: any) => void, disabled?: boolean }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
    preventGoogleFontsLoading: true,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState('');

  const getDisplayLabel = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) {
      return val.label || val.formatted_address || '';
    }
    return '';
  };

  useEffect(() => {
    setInputValue(getDisplayLabel(value));
  }, [value]);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (!place || !place.geometry || !place.geometry.location) {
        toast.warning("Lokasi tidak valid. Silakan pilih dari daftar atau coba lagi.");
        onChange(null);
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const components = place.address_components || [];
      const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || '';

      const structuredAddress = {
        label: place.name || place.formatted_address,
        place_id: place.place_id,
        formatted_address: place.formatted_address,
        lat: lat,
        lng: lng,
        street: [get('route'), get('street_number')].filter(Boolean).join(' '),
        suburb: get('sublocality') || get('sublocality_level_1'),
        city: get('locality') || get('administrative_area_level_2'),
        province: get('administrative_area_level_1'),
        postal_code: get('postal_code'),
        country: get('country'),
      };
      
      onChange(structuredAddress);
      setInputValue(place.formatted_address || place.name || '');
    } else {
      console.error('Autocomplete is not loaded yet!');
    }
  };

  if (loadError) {
    console.error("Google Maps API Load Error:", loadError);
    return (
      <div className="p-3 text-center text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
        Gagal memuat skrip Google Maps. Silakan periksa kunci API Anda dan koneksi internet.
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'id' },
        fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
      }}
    >
      <Input
        type="text"
        placeholder="Mulai ketik alamat..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => {
          if (inputValue !== getDisplayLabel(value)) {
            onChange(inputValue);
          }
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