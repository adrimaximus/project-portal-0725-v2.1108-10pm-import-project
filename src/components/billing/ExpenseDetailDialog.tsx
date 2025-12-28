import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Pencil, Calendar, User, CreditCard, AlignLeft, Building, Link as LinkIcon, Download } from "lucide-react";
import { Expense } from "@/types";
import { formatInJakarta } from "@/lib/utils";

interface ExpenseDetailDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
}

const ExpenseDetailDialog = ({ expense, open, onOpenChange, onEdit }: ExpenseDetailDialogProps) => {
  if (!expense) return null;

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200';
    }
  };

  const attachments = Array.isArray(expense.attachments_jsonb) ? expense.attachments_jsonb : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Expense Details</DialogTitle>
            <Badge variant="outline" className={getStatusColor(expense.status_expense)}>
              {expense.status_expense}
            </Badge>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-6 py-2">
            {/* Amount Section */}
            <div className="text-center p-6 bg-muted/30 rounded-lg border border-dashed">
              <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Total Amount</span>
              <div className="text-3xl font-bold mt-1 text-primary">
                {formatIDR(expense.tf_amount)}
              </div>
            </div>

            <div className="space-y-4">
              {/* Beneficiary */}
              <div className="flex gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Beneficiary</p>
                  <p className="text-sm text-muted-foreground">{expense.beneficiary}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Created Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatInJakarta(expense.created_at, 'dd MMMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>

              {/* Remarks */}
              {expense.remarks && (
                <div className="flex gap-3">
                  <AlignLeft className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Remarks</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{expense.remarks}</p>
                  </div>
                </div>
              )}

              {/* Bank Account */}
              {expense.account_bank && (
                <div className="flex gap-3">
                  <Building className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Bank Details</p>
                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mt-1 border">
                        <p><span className="font-medium">Bank:</span> {(expense.account_bank as any).bank || (expense.account_bank as any).bank_name}</p>
                        <p><span className="font-medium">Account:</span> {(expense.account_bank as any).account || (expense.account_bank as any).account_number}</p>
                        <p><span className="font-medium">Name:</span> {(expense.account_bank as any).name || (expense.account_bank as any).account_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-medium leading-none">Attachments</p>
                    <div className="grid gap-2">
                        {attachments.map((file: any, idx: number) => (
                            <a 
                                key={idx} 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded border bg-background hover:bg-muted/50 transition-colors text-sm group"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="sm:justify-between border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
            </Button>
            <Button onClick={() => { onOpenChange(false); onEdit(expense); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Expense
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailDialog;