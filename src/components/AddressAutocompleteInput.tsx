import React from 'react';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ value, onChange, disabled }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const selectStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      borderColor: 'hsl(var(--input))',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'hsl(var(--input))',
      },
      minHeight: '40px',
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'hsl(var(--popover))',
      zIndex: 9999, // Ensure it's on top of the dialog
    }),
    option: (provided: any, state: { isFocused: boolean; }) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
      color: 'hsl(var(--popover-foreground))',
      '&:active': {
        backgroundColor: 'hsl(var(--accent))',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  let parsedValue = null;
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (parsed.name && parsed.address) {
        parsedValue = { label: `${parsed.name} - ${parsed.address}`, value: parsed };
      } else {
        parsedValue = { label: value, value: null };
      }
    } catch {
      parsedValue = { label: value, value: null };
    }
  }

  const handleSelect = (place: any) => {
    if (place && place.value) {
      const { description, structured_formatting, types } = place.value;
      const name = structured_formatting?.main_text || description;
      const address = description;
      const type = types?.[0]?.replace(/_/g, ' ') || '';
      const venueObject = { name, address, type };
      onChange(JSON.stringify(venueObject));
    } else {
      onChange('');
    }
  };

  return (
    <div className={cn('w-full')}>
      <GooglePlacesAutocomplete
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
        selectProps={{
          value: parsedValue,
          onChange: handleSelect,
          onInputChange: (inputValue, { action }) => {
            if (action === 'input-change') {
              onChange(inputValue);
            }
          },
          isDisabled: disabled,
          placeholder: "Start typing an address...",
          styles: selectStyles,
          menuPortalTarget: document.body,
          theme: (theme) => ({
            ...theme,
            borderRadius: 6,
            colors: {
              ...theme.colors,
              primary: 'hsl(var(--primary))',
              primary75: 'hsl(var(--primary) / 0.75)',
              primary50: 'hsl(var(--primary) / 0.50)',
              primary25: 'hsl(var(--primary) / 0.25)',
            },
          }),
        }}
        autocompletionRequest={{
          componentRestrictions: {
            country: ['id'],
          },
        }}
      />
    </div>
  );
};

export default AddressAutocompleteInput;