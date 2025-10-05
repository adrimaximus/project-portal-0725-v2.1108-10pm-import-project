"use client"

import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, prefix = 'Rp ', ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      // Only format on initial load or when value changes from outside
      setDisplayValue(value.toLocaleString('id-ID'));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Allow user to type freely
      setDisplayValue(rawValue);
      
      const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10);
      
      if (!isNaN(numericValue)) {
        onChange(numericValue);
      } else {
        onChange(0);
      }
    };

    const handleBlur = () => {
      // Format the number on blur
      setDisplayValue(value.toLocaleString('id-ID'));
    };

    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          {prefix}
        </span>
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="pl-10"
          type="text" // Use text to allow for formatted strings
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };