import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PhoneNumberInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const countryCodes = [
  { code: '+62', country: 'Indonesia' },
  { code: '+1', country: 'USA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+65', country: 'Singapore' },
];

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value = '', onChange, disabled }) => {
  const [countryCode, setCountryCode] = useState('+62');
  const [number, setNumber] = useState('');

  useEffect(() => {
    if (value) {
      const foundCode = countryCodes.find(c => value.startsWith(c.code));
      if (foundCode) {
        setCountryCode(foundCode.code);
        setNumber(value.substring(foundCode.code.length));
      } else {
        setNumber(value);
      }
    } else {
      setCountryCode('+62');
      setNumber('');
    }
  }, [value]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\D/g, '');
    setNumber(newNumber);
    onChange(`${countryCode}${newNumber}`);
  };

  const handleCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    onChange(`${newCode}${number}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={countryCode} onValueChange={handleCodeChange} disabled={disabled}>
        <SelectTrigger className="w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map(c => (
            <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder="812 3456 7890"
        disabled={disabled}
      />
    </div>
  );
};

export default PhoneNumberInput;