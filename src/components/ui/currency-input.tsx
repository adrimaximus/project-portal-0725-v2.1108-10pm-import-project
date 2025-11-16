import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number | null;
  onChange: (value: number | null) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== null && value !== undefined) {
        setDisplayValue(new Intl.NumberFormat('id-ID').format(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10);

      if (isNaN(numericValue)) {
        setDisplayValue("");
        onChange(null);
      } else {
        setDisplayValue(new Intl.NumberFormat('id-ID').format(numericValue));
        onChange(numericValue);
      }
    };

    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          Rp
        </span>
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          className="pl-9"
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };