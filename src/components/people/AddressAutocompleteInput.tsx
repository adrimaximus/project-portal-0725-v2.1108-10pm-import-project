import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AddressAutocompleteInputProps {
  value: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

const AddressAutocompleteInput = ({ value, onChange, disabled }: AddressAutocompleteInputProps) => {
  const displayValue = value?.formatted_address || value?.label || '';

  return (
    <div className="space-y-2">
        <Label>Alamat (Debugging)</Label>
        <Input
            value={displayValue}
            onChange={(e) => onChange({ formatted_address: e.target.value, label: e.target.value })}
            placeholder="Masukkan alamat secara manual..."
            disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
            Pelengkapan otomatis dinonaktifkan sementara untuk pengujian.
        </p>
    </div>
  );
};

export default AddressAutocompleteInput;