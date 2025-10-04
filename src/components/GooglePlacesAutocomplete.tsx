import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({ value, onChange, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [internalValue, setInternalValue] = useState(value || '');

  // Sinkronkan state internal saat nilai eksternal berubah (misalnya, saat reset formulir)
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (window.google && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["name", "formatted_address"],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place) {
          let displayValue = place.formatted_address || '';
          // Tambahkan nama di depan jika belum ada di alamat yang diformat
          if (place.name && displayValue && !displayValue.toLowerCase().includes(place.name.toLowerCase())) {
            displayValue = `${place.name} - ${displayValue}`;
          }
          onChange(displayValue); // Perbarui state formulir
          setInternalValue(displayValue); // Perbarui tampilan input
        }
      });
    }
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    // Jangan panggil onChange di sini untuk menghindari pembaruan formulir dengan input parsial
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Saat pengguna mengklik di luar, kita dapat mengasumsikan mereka sudah selesai.
    // Kita teruskan nilai input saat ini ke formulir.
    // Ini menangani kasus di mana mereka mengetik alamat secara manual tanpa memilih.
    onChange(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder || "Cari nama tempat atau alamat..."}
      value={internalValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
    />
  );
};

export default GooglePlacesAutocomplete;