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
    const rawValue = value || '';
    
    const foundCode = countryCodes.find(c => rawValue.startsWith(c.code));

    if (foundCode) {
      setCountryCode(foundCode.code);
      const numberPart = rawValue.substring(foundCode.code.length);
      if (foundCode.code === '+62' && numberPart.length > 0 && !numberPart.startsWith('0')) {
        setNumber('0' + numberPart);
      } else {
        setNumber(numberPart);
      }
    } else {
      const digitsOnly = rawValue.replace(/\D/g, '');
      if (digitsOnly.startsWith('62')) {
        setCountryCode('+62');
        setNumber('0' + digitsOnly.substring(2));
      } else {
        setCountryCode('+62');
        setNumber(digitsOnly);
      }
    }
  }, [value]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\D/g, '');
    setNumber(newNumber);
    
    let numberToEmit = newNumber;
    if (newNumber.startsWith('0') && countryCode === '+62') {
      numberToEmit = newNumber.substring(1);
    }
    onChange(`${countryCode}${numberToEmit}`);
  };

  const handleCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    
    let numberToEmit = number;
    if (number.startsWith('0') && newCode === '+62') {
      numberToEmit = number.substring(1);
    }
    onChange(`${newCode}${numberToEmit}`);
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