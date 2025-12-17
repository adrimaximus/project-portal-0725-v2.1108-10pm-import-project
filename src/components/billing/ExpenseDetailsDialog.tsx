import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Expense } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, generatePastelColor, cn } from "@/lib/utils";
import { CalendarIcon, CreditCard, User, Building2, FileText, Wallet, Eye, AlertCircle, MessageCircle, Reply, Loader2, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const ExpenseDetailsDialog = ({ expense: propExpense, open, onOpenChange }: ExpenseDetailsDialogProps) => {
  const queryClient = useQueryClient();
  const [replyingTermIndex, setReplyingTermIndex] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed [previewFile, setPreviewFile] state

  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    }
  });

  const canEditStatus = useMemo(() => {
    if (!userProfile) return false;
    const role = userProfile.role?.toLowerCase() || '';
    return ['master admin', 'finance', 'admin', 'admin project'].includes(role);
  }, [userProfile]);

  // Fetch latest expense data AND PIC details to ensure UI updates
  const { data: expense } = useQuery({
    queryKey: ['expense_details', propExpense?.id],
    queryFn: async () => {
      if (!propExpense?.id) return null;
      
      // 1. Fetch raw expense data (including attachments_jsonb)
      const { data: expenseData, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', propExpense.id)
        .single();
      
      if (error) throw error;

      // 2. Fetch PIC details if created_by exists
      let pic = null;
      if (expenseData.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', expenseData.created_by)
          .maybeSingle();
          
        if (profile) {
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = (firstName + ' ' + lastName).trim() || profile.email;
          const initials = (firstName && lastName) 
            ? (firstName[0] + lastName[0]).toUpperCase() 
            : (firstName ? firstName[0].toUpperCase() : (profile.email?.substring(0, 2).toUpperCase() || 'NN'));
            
          pic = {
            id: profile.id,
            name: fullName,
            avatar_url: profile.avatar_url,
            initials: initials,
            email: profile.email
          };
        }
      }

      // 3. Fetch Project Name if needed (since raw expense table only has project_id)
      let projectName = propExpense.project_name;
      if (expenseData.project_id && !projectName) {
         const { data: proj } = await supabase.from('projects').select('name').eq('id', expenseData.project_id).maybeSingle();
         if (proj) projectName = proj.name;
      }

      return {
        ...expenseData,
        pic: pic, // Use the fetched PIC details
        project_name: projectName,
        // Ensure attachments_jsonb is explicitly included in the final object
        attachments_jsonb: expenseData.attachments_jsonb,
        // Keep project_owner fallback if needed
        project_owner: propExpense.project_owner 
      } as unknown as Expense;
    },
    enabled: !!propExpense?.id && open,
    initialData: propExpense,
  });

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
      case 'approved': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-700/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const paymentTerms = (expense as any).payment_terms || [];
  const bankDetails = expense.account_bank;
  const attachments: FileMetadata[] = (expense as any).attachments_jsonb || [];

  // Use PIC if available, otherwise fallback to project owner
  const pic = expense.pic || expense.project_owner;
  const picName = pic?.name || 'PIC';

  const handleCopyBankDetails = () => {
    if (!bankDetails) return;
    const textToCopy = `
Beneficiary: ${expense.beneficiary}
Bank Name: ${bankDetails.bank || '-'}
Account Number: ${bankDetails.account || '-'}
Account Name: ${bankDetails.name || '-'}
    `.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success("Bank details copied to clipboard.");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy bank details.");
    });
  };

  // Simplified handler to open URL directly
  const handleViewOrDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const handleReplyClick = (index: number) => {
    setReplyingTermIndex(index);
    setFeedbackText("");
  };

  const submitFeedback = async (index: number) => {
    if (!expense) return;
    setIsSubmitting(true);
    try {
        const updatedTerms = [...(expense.payment_terms as any[])];
        updatedTerms[index] = {
            ...updatedTerms[index],
            pic_feedback: feedbackText
        };

        const { error } = await supabase
            .from('expenses')
            .update({ payment_terms: updatedTerms })
            .eq('id', expense.id);

        if (error) throw error;

        toast.success("Feedback sent successfully");
        setReplyingTermIndex(null);
        setFeedbackText("");
        
        // Refresh data explicitly for this dialog and the main list
        await queryClient.invalidateQueries({ queryKey: ['expense_details', expense.id] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        
    } catch (err: any) {
        toast.error("Failed to send feedback", { description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const updateTermStatus = async (index: number, newStatus: string) => {
    if (!expense) return;
    try {
      const updatedTerms = [...(expense.payment_terms as any[])];
      updatedTerms[index] = {
        ...updatedTerms[index],
        status: newStatus
      };

      const { error } = await supabase
        .from('expenses')
        .update({ payment_terms: updatedTerms })
        .eq('id', expense.id);

      if (error) throw error;
      
      toast.success("Term status updated");
      // Refresh data explicitly for this dialog and the main list
      await queryClient.invalidateQueries({ queryKey: ['expense_details', expense.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    }
  };

  return (
    <>
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
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => handleViewOrDownload(file.url)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View / Download</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Bank Details */}
              {bankDetails && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold text-sm">Bank Account Details</h4>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={handleCopyBankDetails}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Bank Details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                </>
              )}

              {/* Payment Terms */}
              {paymentTerms.length > 0 && (
                <>
                  <Separator />
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
                              {canEditStatus ? (
                                <div className="flex justify-end">
                                  <Select 
                                    value={term.status || 'Pending'} 
                                    onValueChange={(val) => updateTermStatus(index, val)}
                                  >
                                    <SelectTrigger className={cn("h-6 px-1.5 text-[10px] font-medium border-0 rounded-full w-auto min-w-[70px] gap-1", getStatusBadgeStyle(term.status || 'Pending'))}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {['Pending', 'Requested', 'On review', 'Paid', 'Rejected'].map((status) => (
                                         <SelectItem key={status} value={status}>{status}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", getStatusBadgeStyle(term.status || 'Pending'))}>
                                  {term.status || 'Pending'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Conditional Display for Pending/Rejected Reasons */}
                          {['Pending', 'Rejected'].includes(term.status) && (term.status_remarks || term.pic_feedback || replyingTermIndex === index) && (
                            <div className="px-3 pb-3 pt-0 text-xs space-y-2">
                              {term.status_remarks && (
                                <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-100 dark:border-yellow-900/30 flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <AlertCircle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                                    <div className="space-y-0.5 flex-1">
                                      <span className="font-semibold text-yellow-700 dark:text-yellow-500 block">Finance Note:</span>
                                      <p className="text-yellow-800 dark:text-yellow-200/80">{term.status_remarks}</p>
                                    </div>
                                    {!term.pic_feedback && replyingTermIndex !== index && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                                        onClick={() => handleReplyClick(index)}
                                        title="Reply to note"
                                      >
                                        <Reply className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Reply Form */}
                                  {replyingTermIndex === index && (
                                    <div className="pl-6 space-y-2 mt-1">
                                        <Textarea 
                                            value={feedbackText} 
                                            onChange={(e) => setFeedbackText(e.target.value)} 
                                            placeholder="Write your feedback..."
                                            className="text-xs min-h-[60px] bg-background/80"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setReplyingTermIndex(null)}>Cancel</Button>
                                            <Button size="sm" className="h-6 text-xs px-2" onClick={() => submitFeedback(index)} disabled={isSubmitting || !feedbackText.trim()}>
                                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send Feedback'}
                                            </Button>
                                        </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {term.pic_feedback && (
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded border border-blue-100 dark:border-blue-900/30 flex gap-2 ml-4">
                                  <MessageCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-blue-700 dark:text-blue-500 block">{picName} Feedback:</span>
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
                </>
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
      {/* Removed Preview Dialog */}
    </>
  );
};

export default ExpenseDetailsDialog;