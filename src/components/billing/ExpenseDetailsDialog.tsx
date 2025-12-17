import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  User, 
  Building2, 
  AlignLeft,
  Download,
  ExternalLink,
  Receipt
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/expense";

interface ExpenseDetailsDialogProps {
  expense: any; // Using any to be flexible with the prop structure
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileMetadata {
  name: string;
  url: string;
  type: string;
  size: number;
}

export default function ExpenseDetailsDialog({ 
  expense: propExpense, 
  open, 
  onOpenChange 
}: ExpenseDetailsDialogProps) {
  
  // Fetch full expense details to get latest attachments
  const { data: expense } = useQuery({
    queryKey: ['expense-details', propExpense?.id],
    queryFn: async () => {
      if (!propExpense?.id) return null;
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name, created_by),
          creator:created_by(id, first_name, last_name, email, avatar_url)
        `)
        .eq('id', propExpense.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    initialData: propExpense,
    enabled: open && !!propExpense?.id
  });

  if (!expense) return null;

  const attachments: FileMetadata[] = (expense.attachments_jsonb as any) || [];
  const paymentTerms = (expense.payment_terms as any) || [];
  
  // Use explicit bank account if available, otherwise use JSONB or legacy structure
  const bankDetails = expense.account_bank;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start gap-4 pr-8">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {expense.beneficiary}
                <Badge variant="outline" className={getStatusColor(expense.status_expense)}>
                  {expense.status_expense || 'Pending'}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5" />
                {expense.project?.name || expense.project_name || 'No Project'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                Rp {Number(expense.tf_amount).toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-muted-foreground">
                Due: {expense.due_date ? format(new Date(expense.due_date), 'dd MMM yyyy') : '-'}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Payment Details
              </h3>
              <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="col-span-2 font-medium">{bankDetails?.bank || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="col-span-2 font-medium">{bankDetails?.account || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="col-span-2 font-medium">{bankDetails?.name || '-'}</span>
                </div>
              </div>
            </div>

            {/* Purpose & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(expense.purpose_payment || expense.remarks) && (
                <div className="space-y-3 col-span-2">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <AlignLeft className="h-4 w-4" /> Description
                  </h3>
                  <div className="bg-card border rounded-lg p-4 text-sm space-y-4">
                    {expense.purpose_payment && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Purpose</span>
                        <p>{expense.purpose_payment}</p>
                      </div>
                    )}
                    {expense.remarks && (
                      <>
                        {expense.purpose_payment && <Separator className="my-2" />}
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Remarks</span>
                          <p className="whitespace-pre-wrap">{expense.remarks}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            {paymentTerms.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Payment Terms
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Percentage</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paymentTerms.map((term: any, index: number) => (
                        <tr key={index}>
                          <td className="p-3">{term.name}</td>
                          <td className="p-3 text-right">{term.percentage}%</td>
                          <td className="p-3 text-right">
                            Rp {((Number(expense.tf_amount) * term.percentage) / 100).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="secondary" className="text-xs">
                              {term.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium">
                    {expense.creator?.first_name 
                      ? `${expense.creator.first_name} ${expense.creator.last_name || ''}`
                      : (expense.pic?.name || 'Unknown')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project Owner</p>
                  <p className="text-sm font-medium">
                    {expense.project_owner?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" /> Attachments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          {file.type?.startsWith('image/') ? (
                            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-full"
                          title="View"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                        <a 
                          href={file.url} 
                          download={file.name}
                          className="p-2 hover:bg-muted rounded-full"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}