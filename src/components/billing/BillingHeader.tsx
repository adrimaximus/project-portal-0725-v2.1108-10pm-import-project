import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface BillingHeaderProps {
  invoiceCount: number;
  totalAmount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const BillingHeader = ({ invoiceCount, totalAmount, searchTerm, onSearchChange }: BillingHeaderProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{invoiceCount} invoices</span>
          <span>|</span>
          <span>Total Amount: {'Rp ' + totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};