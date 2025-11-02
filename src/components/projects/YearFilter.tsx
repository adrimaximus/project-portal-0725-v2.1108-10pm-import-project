import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface YearFilterProps {
  availableYears: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

const YearFilter = ({ availableYears, selectedYear, onYearChange }: YearFilterProps) => {
  const currentYear = new Date().getFullYear();

  const options = [
    { label: 'Current & Upcoming', value: String(currentYear) },
    ...(availableYears || [])
      .filter(year => year < currentYear)
      .map(year => ({ label: String(year), value: String(year) })),
    { label: 'Archive (Older)', value: '0' },
  ];

  return (
    <Select
      value={selectedYear === null ? String(currentYear) : String(selectedYear)}
      onValueChange={(value) => onYearChange(Number(value))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by year..." />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default YearFilter;