import React, { useState, useEffect, useRef } from 'react';
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
  const [localNumber, setLocalNumber] = useState('');
  // Ref ini akan menyimpan nilai terakhir yang dikirim ke komponen induk.
  const lastEmittedValue = useRef<string | undefined>();

  useEffect(() => {
    // Jika nilai yang masuk sama dengan yang terakhir kita kirim, itu adalah gema.
    // Kita bisa mengabaikannya untuk mencegah loop dan membiarkan pengguna terus mengetik.
    if (value === lastEmittedValue.current) {
      return;
    }

    const rawValue = value || '';
    
    const foundCode = countryCodes
      .sort((a, b) => b.code.length - a.code.length)
      .find(c => rawValue.startsWith(c.code));

    if (foundCode) {
      setCountryCode(foundCode.code);
      const numberPart = rawValue.substring(foundCode.code.length);
      setLocalNumber(numberPart);
    } else {
      // Jika tidak ada kode, asumsikan itu adalah nomor lokal Indonesia dan default ke +62
      setCountryCode('+62');
      setLocalNumber(rawValue.replace(/\D/g, ''));
    }
    // Saat kita menerima perubahan eksternal, kita juga harus memperbarui ref lastEmittedValue kita
    // agar sinkron dengan state baru.
    lastEmittedValue.current = value;
  }, [value]);

  const triggerChange = (code: string, num: string) => {
    let numberToEmit = num.replace(/\D/g, '');
    // Saat menyimpan, hapus '0' di depan untuk nomor Indonesia jika ada
    if (code === '+62' && numberToEmit.startsWith('0')) {
      numberToEmit = numberToEmit.substring(1);
    }
    
    const fullNumber = `${code}${numberToEmit}`;
    lastEmittedValue.current = fullNumber;
    onChange(fullNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Izinkan hanya angka
    const newNumber = e.target.value.replace(/[^0-9]/g, '');
    setLocalNumber(newNumber);
    triggerChange(countryCode, newNumber);
  };

  const handleCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    triggerChange(newCode, localNumber);
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
        value={localNumber}
        onChange={handleNumberChange}
        placeholder="812 3456 7890"
        disabled={disabled}
      />
    </div>
  );
};

export default PhoneNumberInput;