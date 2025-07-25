"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatValue = (num: number | undefined): string => {
      if (num === undefined || num === null) return "";
      // Menggunakan 'en-US' untuk mendapatkan pemisah koma
      return new Intl.NumberFormat("en-US").format(num);
    };

    const parseValue = (str: string): number | undefined => {
      const cleaned = str.replace(/[^0-9]/g, "");
      if (cleaned === "") return undefined;
      return parseInt(cleaned, 10);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseValue(e.target.value);
      onChange(parsed);
    };

    const handleCopy = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (value !== undefined) {
        e.clipboardData.setData("text/plain", String(value));
        e.preventDefault();
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={formatValue(value)}
        onChange={handleChange}
        onCopy={handleCopy}
        type="text"
        inputMode="numeric"
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };