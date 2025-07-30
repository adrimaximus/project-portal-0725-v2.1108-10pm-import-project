"use client";

import { Saturation, Hue } from "react-colorful";
import { hsvaToHex, hexToHsva } from "@uiw/color-convert";
import { Input } from "@/components/ui/input";

interface CustomColorPickerProps {
  color: string;
  onChange: (newColor: string) => void;
}

export const CustomColorPicker = ({ color, onChange }: CustomColorPickerProps) => {
  // hsva diturunkan dari prop warna.
  // Kami menggunakan try-catch jika hex tidak valid selama input pengguna.
  const hsva = (() => {
    try {
      return hexToHsva(color);
    } catch (e) {
      return hexToHsva("#000000"); // fallback
    }
  })();

  return (
    <div className="space-y-3 w-full">
      <div style={{ height: 150, width: '100%', position: 'relative' }}>
        <Saturation
          hsva={hsva}
          onChange={(newHsva) => onChange(hsvaToHex(newHsva))}
        />
      </div>
      <div style={{ height: 12, width: '100%', position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
        <Hue
          hue={hsva.h}
          onChange={(newHue) => onChange(hsvaToHex({ ...hsva, ...newHue }))}
        />
      </div>
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