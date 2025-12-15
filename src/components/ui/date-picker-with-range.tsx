import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  date?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {
  const isRangeSelected = date?.from;

  const displayDate = React.useMemo(() => {
    if (date?.from) {
      if (date.to) {
        return (
          <>
            {format(date.from, "LLL dd, y")} -{" "}
            {format(date.to, "LLL dd, y")}
          </>
        );
      }
      return format(date.from, "LLL dd, y");
    }
    return null;
  }, [date]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              "sm:w-[280px]",
              // Jika tidak ada rentang yang dipilih, buat tombol kecil dan terpusat di mobile (hanya ikon)
              !isRangeSelected && "max-sm:w-10 max-sm:justify-center max-sm:px-2"
            )}
          >
            {/* Calendar Icon - Selalu terlihat */}
            <CalendarIcon 
              className={cn(
                "h-4 w-4 flex-shrink-0", 
                // Tambahkan margin kanan hanya jika teks akan ditampilkan
                isRangeSelected ? "mr-2" : "mr-0"
              )} 
            />
            
            {/* Konten Area */}
            {isRangeSelected ? (
              /* Konten ketika rentang dipilih (terlihat di semua layar) */
              <span className="truncate flex-1">
                {displayDate}
              </span>
            ) : (
              /* Konten ketika tidak ada rentang yang dipilih (hanya terlihat di desktop) */
              <span className="hidden sm:inline ml-2 flex-1 truncate">
                Pick a date range
              </span>
            )}
            
            {/* Tombol Hapus (hanya terlihat jika dipilih) */}
            {isRangeSelected && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto text-muted-foreground hover:text-foreground flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDateChange(undefined);
                }}
              >
                <span className="sr-only">Clear date filter</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}