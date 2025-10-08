import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export interface BillingToolbarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const BillingToolbar = ({ searchTerm, onSearchTermChange }: BillingToolbarProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice #, project, client, PO #, or channel..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
};

export default BillingToolbar;