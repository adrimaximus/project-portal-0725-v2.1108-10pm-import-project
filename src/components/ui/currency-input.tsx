"use client"

import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Effect to format the value from the parent state
    React.useEffect(() => {
      if (value === null || value === undefined || isNaN(value)) {
        setDisplayValue('');
      } else {
        // Only format if it's different from what would be parsed from current display
        const currentNumeric = parseInt(displayValue.replace(/[^0-9]/g, ''), 10);
        if (isNaN(currentNumeric) || currentNumeric !== value) {
          setDisplayValue(new Intl.NumberFormat('id-ID').format(value));
        }
      }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, '');
      const numericValue = rawValue ? parseInt(rawValue, 10) : null;

      // Update the parent with the raw numeric value
      onChange(numericValue);

      // Update the local display value with formatting
      if (numericValue !== null) {
        setDisplayValue(new Intl.NumberFormat('id-ID').format(numericValue));
      } else {
        setDisplayValue('');
      }
    };

    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          Rp
        </span>
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder="0"
          className="pl-9"
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }