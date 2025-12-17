import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Expense } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, generatePastelColor, cn } from "@/lib/utils";
import { CalendarIcon, CreditCard, User, Building2, FileText, Wallet, Eye, AlertCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}

interface ExpenseDetailsDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ExpenseDetailsDialog = ({ expense, open, onOpenChange }: ExpenseDetailsDialogProps) => {
  // Calculate status based on payment terms
  const derivedStatus = useMemo(() => {
    if (!expense?.payment_terms || expense.payment_terms.length === 0) return expense?.status_expense || 'Pending';
    
    const terms = (expense.payment_terms as any[]);
    const statuses = terms.map(t => t.status || 'Pending');
    
    // Logic priority: Rejected > On review > Paid (All) > Requested (All) > Pending
    if (statuses.some(s => s === 'Rejected')) return 'Rejected';
    if (statuses.some(s => s === 'On review')) return 'On review';
    if (statuses.every(s => s === 'Paid')) return 'Paid';
    if (statuses.every(s => s === 'Requested')) return 'Requested';
    
    return 'Pending';
  }, [expense]);

  if (!expense) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50';
      case 'on review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';
      case 'requested': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const paymentTerms = (expense as any).payment_terms || [];
  const bankDetails = expense.account_bank;
  const attachments: FileMetadata[] = (expense as any).attachments_jsonb || [];

  // Use PIC if available, otherwise fallback to project owner (for backward compatibility)
  const pic = expense.pic || expense.project_owner;

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start gap-4 pr-8">
            <div>
              <DialogTitle className="text-xl">{expense.beneficiary}</DialogTitle>
              <DialogDescription className="mt-1">
                {expense.project_name}
              </DialogDescription>
            </div>
            <Badge className={cn("text-sm px-3 py-1", getStatusBadgeStyle(derivedStatus))}>
              {derivedStatus}
            </Badge>
          </div>
        </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(expense.tf_amount)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p className="text-sm font-medium">{(expense as any).purpose_payment || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issued</p>
                    <p className="text-sm font-medium">
                      {expense.created_at ? format(new Date(expense.created_at), "PPP") : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">PIC</p>
                    {pic ? (
                        <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={getAvatarUrl(pic.avatar_url, pic.id)} />
                            <AvatarFallback className="text-[10px]" style={generatePastelColor(pic.id)}>
                            {pic.initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{pic.name}</span>
                        </div>
                    ) : (
                        <p className="text-sm font-medium">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Attachments ({attachments.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/40">
                        <div className="flex items-center space-x-3 truncate">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.url)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View/Download</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Bank Details */}
            {bankDetails && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">Bank Account Details</h4>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg border text-sm space-y-1">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span className="col-span-2 font-medium">{bankDetails.bank || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="col-span-2 font-medium font-mono">{bankDetails.account || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Account Name:</span>
                    <span className="col-span-2 font-medium">{bankDetails.name || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Terms */}
            {paymentTerms.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">Payment Plan</h4>
                </div>
                <div className="border rounded-lg overflow-hidden divide-y">
                  <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2 text-xs font-medium text-muted-foreground">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-4">Amount</div>
                    <div className="col-span-3">Due Date</div>
                    <div className="col-span-4 text-right">Status</div>
                  </div>
                  {paymentTerms.map((term: any, index: number) => (
                    <div key={index} className="flex flex-col bg-card">
                      <div className="grid grid-cols-12 gap-2 p-2 text-sm items-center">
                        <div className="col-span-1 text-center text-muted-foreground">{index + 1}</div>
                        <div className="col-span-4 font-medium">{formatCurrency(term.amount || 0)}</div>
                        <div className="col-span-3 text-xs text-muted-foreground">
                          {term.release_date ? format(new Date(term.release_date), "dd MMM yyyy") : (term.request_date ? format(new Date(term.request_date), "dd MMM yyyy") : '-')}
                        </div>
                        <div className="col-span-4 text-right">
                          <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", getStatusBadgeStyle(term.status || 'Pending'))}>
                            {term.status || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Conditional Display for Pending/Rejected Reasons */}
                      {['Pending', 'Rejected'].includes(term.status) && (term.status_remarks || term.pic_feedback) && (
                        <div className="px-3 pb-3 pt-0 text-xs space-y-2">
                          {term.status_remarks && (
                            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-100 dark:border-yellow-900/30 flex gap-2">
                              <AlertCircle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                              <div className="space-y-0.5">
                                <span className="font-semibold text-yellow-700 dark:text-yellow-500 block">Finance Note:</span>
                                <p className="text-yellow-800 dark:text-yellow-200/80">{term.status_remarks}</p>
                              </div>
                            </div>
                          )}
                          {term.pic_feedback && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded border border-blue-100 dark:border-blue-900/30 flex gap-2 ml-4">
                              <MessageCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                              <div className="space-y-0.5">
                                <span className="font-semibold text-blue-700 dark:text-blue-500 block">PIC Feedback:</span>
                                <p className="text-blue-800 dark:text-blue-200/80">{term.pic_feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            {expense.remarks && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Remarks</h4>
                <p className="text-sm bg-muted/30 p-3 rounded-md border whitespace-pre-wrap">{expense.remarks}</p>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailsDialog;