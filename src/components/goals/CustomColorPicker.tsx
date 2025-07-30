"use client";

import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";

interface CustomColorPickerProps {
  color: string;
  onChange: (newColor: string) => void;
}

export const CustomColorPicker = ({ color, onChange }: CustomColorPickerProps) => {
  return (
    <div className="space-y-3 w-full">
      <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
      <div className="flex items-center gap-2 pt-2">
        <div
          className="w-7 h-7 rounded-md border"
          style={{ backgroundColor: color }}
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 uppercase font-mono text-sm"
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  );
};