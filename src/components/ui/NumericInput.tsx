import * as React from 'react';
import { Input } from '@/components/ui/input';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      if (value !== null && value !== undefined && !isNaN(value)) {
        setDisplayValue(value.toLocaleString('id-ID'));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const numericString = rawValue.replace(/[^0-9]/g, '');
      const numericValue = numericString ? parseInt(numericString, 10) : 0;
      
      onChange(numericValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        type="text"
        inputMode="numeric"
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';

export { NumericInput };