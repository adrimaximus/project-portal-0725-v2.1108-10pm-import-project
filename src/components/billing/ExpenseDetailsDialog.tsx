import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Expense } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, generatePastelColor, cn } from "@/lib/utils";
import { CalendarIcon, CreditCard, User, Building2, FileText, Wallet, Eye, AlertCircle, MessageCircle, Reply, Loader2, Copy, Download, Edit, Paperclip, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import ReactMarkdown from 'react-markdown';

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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // Use an object to track which specific feedback type is being replied to/edited
  const [replyingTerm, setReplyingTerm] = useState<{ index: number, type: 'finance' | 'pic' } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackAttachment, setFeedbackAttachment] = useState<File | null>(null); // New state for attachment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

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
  
  const isCurrentPic = useMemo(() => {
    return userProfile?.id === propExpense?.created_by;
  }, [userProfile, propExpense]);

  // Fetch latest expense data AND PIC details to ensure UI updates
  const { data: expense } = useQuery({
    queryKey: ['expense_details', propExpense?.id],
    queryFn: async () => {
      if (!propExpense?.id) return null;
      
      // 1. Fetch raw expense data (including attachments_jsonb) and tags
      const { data: expenseData, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_tags (
            tags (*)
          )
        `)
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

      const tags = expenseData.expense_tags?.map((et: any) => et.tags) || [];

      return {
        ...expenseData,
        pic: pic, // Use the fetched PIC details
        project_name: projectName,
        // Ensure attachments_jsonb is explicitly included in the final object
        attachments_jsonb: expenseData.attachments_jsonb,
        // Keep project_owner fallback if needed
        project_owner: propExpense.project_owner,
        tags: tags
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

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleView = (file: FileMetadata) => {
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setPreviewFile(file);
    } else {
        window.open(file.url, '_blank');
    }
  };

  const handleReplyClick = (index: number, type: 'finance' | 'pic', existingFeedback?: string, existingAttachment?: FileMetadata) => {
    setReplyingTerm({ index, type });
    setFeedbackText(existingFeedback || "");
    // When opening the form, clear the attachment state as we only handle new uploads/replacements here.
    setFeedbackAttachment(null); 
  };

  const submitFeedback = async () => {
    if (!expense || !replyingTerm) return;
    
    const { index, type } = replyingTerm;
    setIsSubmitting(true);
    
    try {
        // --- File Upload Logic ---
        let attachmentMetadata: FileMetadata | null = null;
        
        if (feedbackAttachment) {
            const file = feedbackAttachment;
            const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
            const filePath = `expense-feedback/${expense.id}/${index}/${Date.now()}-${sanitizedFileName}`;
            
            const { error: uploadError } = await supabase.storage.from('expense').upload(filePath, file);
            if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
            
            const { data: urlData } = supabase.storage.from('expense').getPublicUrl(filePath);
            
            attachmentMetadata = {
                name: file.name,
                url: urlData.publicUrl,
                size: file.size,
                type: file.type,
                storagePath: filePath
            };
        } else {
            // If editing existing feedback and no new file is selected, retain the old attachment if it exists
            const existingTerm = (expense.payment_terms as any[])[index];
            if (type === 'pic' && existingTerm.pic_attachment && !feedbackText.trim() && !existingTerm.pic_feedback) {
                // If user clears text but keeps attachment, we should probably allow it, but for now, if both are empty, we clear the attachment too.
                // If the user is editing and clears the attachment, feedbackAttachment is null, and we set attachmentMetadata to null below.
            }
        }
        // --- End File Upload Logic ---

        const updatedTerms = [...(expense.payment_terms as any[])];
        
        if (type === 'pic' || type === 'finance') {
            // Determine the final attachment metadata. If a new file was uploaded, use that. 
            // If no new file, check if the user is editing existing feedback.
            const existingAttachment = updatedTerms[index].pic_attachment as FileMetadata | undefined;
            
            let finalAttachment = attachmentMetadata;
            
            // If we are editing (type='pic') and no new file was uploaded, keep the existing one 
            // UNLESS the user explicitly removed it (which we don't support yet, but clearing feedbackAttachment handles new uploads).
            // If editing and no new file is selected, keep the existing one.
            if (type === 'pic' && !feedbackAttachment && existingAttachment) {
                finalAttachment = existingAttachment;
            }
            
            // If the user clears the text and there is no new attachment, clear the old attachment too.
            if (!feedbackText.trim() && !feedbackAttachment) {
                finalAttachment = null;
            }


            updatedTerms[index] = {
                ...updatedTerms[index],
                pic_feedback: feedbackText,
                pic_attachment: finalAttachment,
            };
        }

        const { error } = await supabase
            .from('expenses')
            .update({ payment_terms: updatedTerms })
            .eq('id', expense.id);

        if (error) throw error;

        toast.success("Feedback saved successfully");
        setReplyingTerm(null);
        setFeedbackText("");
        setFeedbackAttachment(null);
        
        // Refresh data explicitly for this dialog and the main list
        await queryClient.invalidateQueries({ queryKey: ['expense_details', expense.id] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        
    } catch (err: any) {
        toast.error("Failed to save feedback.", { description: err.message });
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

  const isReplyingTo = (index: number, type: 'finance' | 'pic') => 
    replyingTerm?.index === index && replyingTerm.type === type;

  // Shared content for both Dialog and Drawer
  const content = (
    <div className="grid gap-6 py-4 w-full">
      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-lg font-bold">{formatCurrency(expense.tf_amount)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {expense.tags && expense.tags.length > 0 ? (
                  expense.tags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline" 
                      style={{ 
                        backgroundColor: `${tag.color}15`, 
                        color: tag.color,
                        borderColor: `${tag.color}40` 
                      }}
                      className="text-[10px] px-1 py-0 h-5"
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm font-medium">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Issued</p>
              <p className="text-sm font-medium">
                {expense.created_at ? format(new Date(expense.created_at), "PPP") : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium">
                {expense.due_date ? format(new Date(expense.due_date), "PPP") : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">PIC</p>
              {pic ? (
                  <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={getAvatarUrl(pic.avatar_url, pic.id)} />
                      <AvatarFallback className="text-[10px]" style={generatePastelColor(pic.id)}>
                      {pic.initials}
                      </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{pic.name}</span>
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
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <h4 className="font-semibold text-sm">Attachments ({attachments.length})</h4>
            </div>
            <div className="space-y-2 w-full">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/40 w-full">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-all">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(file)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.url, file.name)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
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
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
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
            <div className="bg-muted/40 p-4 rounded-lg border text-sm space-y-1 w-full">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="col-span-2 font-medium break-words">{bankDetails.bank || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="col-span-2 font-medium font-mono break-all">{bankDetails.account || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="col-span-2 font-medium break-words">{bankDetails.name || '-'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Terms */}
      {paymentTerms.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
              <h4 className="font-semibold text-sm">Payment Plan</h4>
            </div>
            <div className="border rounded-lg overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <div className="w-full divide-y">
                  <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2 text-xs font-medium text-muted-foreground min-w-full">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-4">Amount</div>
                    <div className="col-span-3">Due Date</div>
                    <div className="col-span-4 text-right">Status</div>
                  </div>
                  {paymentTerms.map((term: any, index: number) => (
                    <div key={index} className="flex flex-col bg-card w-full">
                      <div className="grid grid-cols-12 gap-2 p-2 text-sm items-center w-full">
                        <div className="col-span-1 text-center text-muted-foreground">{index + 1}</div>
                        <div className="col-span-4 font-medium truncate">{formatCurrency(term.amount || 0)}</div>
                        <div className="col-span-3 text-xs text-muted-foreground truncate">
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
                      {['Pending', 'Rejected'].includes(term.status) && (term.status_remarks || term.pic_feedback || isReplyingTo(index, 'finance') || isReplyingTo(index, 'pic')) && (
                        <div className="px-3 pb-3 pt-0 text-xs space-y-2 w-full">
                          {term.status_remarks && (
                            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-100 dark:border-yellow-900/30 flex flex-col gap-2 w-full">
                              <div className="flex gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="font-semibold text-yellow-700 dark:text-yellow-500 block">Finance Note:</span>
                                  <p className="text-yellow-800 dark:text-yellow-200/80 break-words">{term.status_remarks}</p>
                                </div>
                                {/* Reply button for PIC to respond to Finance Note */}
                                {isCurrentPic && !term.pic_feedback && !isReplyingTo(index, 'finance') && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 shrink-0"
                                    onClick={() => handleReplyClick(index, 'finance')}
                                    title="Reply to note"
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Reply Form (only for replying to Finance Note) */}
                              {isReplyingTo(index, 'finance') && (
                                <div className="pl-6 space-y-2 mt-1 w-full">
                                    <Textarea 
                                        value={feedbackText} 
                                        onChange={(e) => setFeedbackText(e.target.value)} 
                                        placeholder="Write your feedback..."
                                        className="text-xs min-h-[60px] bg-background/80 w-full"
                                    />
                                    {/* Attachment Display for Reply */}
                                    {feedbackAttachment && (
                                        <div className="flex items-center justify-between text-xs text-muted-foreground p-2 border rounded bg-background w-full">
                                            <span className="truncate flex items-center gap-1 min-w-0">
                                                <Paperclip className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{feedbackAttachment.name}</span> 
                                                <span className="shrink-0">({formatFileSize(feedbackAttachment.size)})</span>
                                            </span>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 text-red-500 shrink-0" 
                                                onClick={() => setFeedbackAttachment(null)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center w-full">
                                        {/* File Input Button */}
                                        <input 
                                            id={`feedback-file-upload-finance-${index}`}
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setFeedbackAttachment(e.target.files[0]);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                                                        onClick={() => document.getElementById(`feedback-file-upload-finance-${index}`)?.click()}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Paperclip className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Attach File</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setReplyingTerm(null)}>Cancel</Button>
                                            <Button size="sm" className="h-6 text-xs px-2" onClick={submitFeedback} disabled={isSubmitting || (!feedbackText.trim() && !feedbackAttachment)}>
                                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send Feedback'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                              )}
                            </div>
                          )}
                          {term.pic_feedback && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded border border-blue-100 dark:border-blue-900/30 flex flex-col gap-2 ml-4">
                              <div className="flex gap-2">
                                <MessageCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="font-semibold text-blue-700 dark:text-blue-500 block">{picName} Feedback:</span>
                                  <p className="text-blue-800 dark:text-blue-200/80 break-words">{term.pic_feedback}</p>
                                </div>
                                {/* Edit button for PIC to edit their own feedback */}
                                {isCurrentPic && !isReplyingTo(index, 'pic') && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 shrink-0"
                                    onClick={() => handleReplyClick(index, 'pic', term.pic_feedback, term.pic_attachment)}
                                    title="Edit Feedback"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              {/* Display existing attachment */}
                              {term.pic_attachment && !isReplyingTo(index, 'pic') && (
                                  <div className="flex items-center justify-between text-xs text-muted-foreground p-2 border rounded bg-background w-full">
                                      <span className="truncate flex items-center gap-1 min-w-0">
                                          <Paperclip className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{term.pic_attachment.name}</span>
                                          <span className="shrink-0">({formatFileSize(term.pic_attachment.size)})</span>
                                      </span>
                                      <div className="flex items-center space-x-1 shrink-0">
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger asChild>
                                                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleView(term.pic_attachment)}>
                                                          <Eye className="h-3 w-3" />
                                                      </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>View</TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger asChild>
                                                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(term.pic_attachment.url, term.pic_attachment.name)}>
                                                          <Download className="h-3 w-3" />
                                                      </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Download</TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                      </div>
                                  </div>
                              )}
                              {/* Reply Form (for editing existing PIC feedback) */}
                              {isReplyingTo(index, 'pic') && (
                                <div className="pl-6 space-y-2 mt-1 w-full">
                                    <Textarea 
                                        value={feedbackText} 
                                        onChange={(e) => setFeedbackText(e.target.value)} 
                                        placeholder="Edit your feedback..."
                                        className="text-xs min-h-[60px] bg-background/80 w-full"
                                    />
                                    {/* Attachment Display for Edit */}
                                    {(feedbackAttachment || term.pic_attachment) && (
                                        <div className="flex items-center justify-between text-xs text-muted-foreground p-2 border rounded bg-background w-full">
                                            <span className="truncate flex items-center gap-1 min-w-0">
                                                <Paperclip className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{feedbackAttachment ? feedbackAttachment.name : term.pic_attachment.name}</span>
                                                <span className="shrink-0">({formatFileSize(feedbackAttachment ? feedbackAttachment.size : term.pic_attachment.size)})</span>
                                            </span>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 text-red-500 shrink-0" 
                                                onClick={() => setFeedbackAttachment(null)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center w-full">
                                        {/* File Input Button */}
                                        <input 
                                            id={`feedback-file-upload-pic-${index}`}
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setFeedbackAttachment(e.target.files[0]);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                                                        onClick={() => document.getElementById(`feedback-file-upload-pic-${index}`)?.click()}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Paperclip className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Attach File</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setReplyingTerm(null)}>Cancel</Button>
                                            <Button size="sm" className="h-6 text-xs px-2" onClick={submitFeedback} disabled={isSubmitting || (!feedbackText.trim() && !feedbackAttachment && !term.pic_attachment)}>
                                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Remarks */}
      {expense.remarks && (
        <div className="space-y-2 w-full">
          <h4 className="font-semibold text-sm text-muted-foreground">Remarks</h4>
          <div className="text-sm bg-muted/30 p-3 rounded-md border break-words">
            <ReactMarkdown 
              components={{
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
                p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
              }}
            >
              {expense.remarks}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );

  const Title = isDesktop ? DialogTitle : DrawerTitle;
  const Description = isDesktop ? DialogDescription : DrawerDescription;

  if (isDesktop) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 pr-8">
                <div>
                  <Title className="text-xl">{expense.beneficiary}</Title>
                  <Description className="mt-1">
                    {expense.project_name}
                  </Description>
                </div>
                <Badge className={cn("text-sm px-3 py-1 self-start sm:self-auto", getStatusBadgeStyle(derivedStatus))}>
                  {derivedStatus}
                </Badge>
              </div>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
        {/* Preview Dialog remains as Dialog on Desktop */}
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="truncate pr-8">{previewFile?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center p-4">
               {previewFile?.type === 'application/pdf' ? (
                   <iframe 
                      src={`${previewFile.url}#view=FitH`} 
                      title={previewFile.name}
                      className="w-full h-full border-none rounded-md" 
                   />
               ) : (
                   <img 
                      src={previewFile?.url} 
                      alt={previewFile?.name} 
                      className="max-w-full max-h-full object-contain rounded-md shadow-sm" 
                   />
               )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => window.open(previewFile?.url, '_blank')}>
                  Open Original
              </Button>
              <Button onClick={() => setPreviewFile(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Mobile View using Drawer
  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <DrawerHeader className="text-left border-b pb-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <DrawerTitle className="text-xl truncate pr-2">{expense.beneficiary}</DrawerTitle>
                  <DrawerDescription className="mt-1 break-words">
                    {expense.project_name}
                  </DrawerDescription>
                </div>
                <Badge className={cn("text-sm px-2 py-1 shrink-0", getStatusBadgeStyle(derivedStatus))}>
                  {derivedStatus}
                </Badge>
              </div>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>

      {/* File Preview for Mobile - can also use Drawer or full screen Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="w-full h-[100dvh] max-w-full rounded-none border-0 p-0 flex flex-col">
          <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0 bg-background">
            <DialogTitle className="truncate pr-4 text-base">{previewFile?.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="-mr-2">
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center p-4">
             {previewFile?.type === 'application/pdf' ? (
                 <iframe 
                    src={`${previewFile.url}#view=FitH`} 
                    title={previewFile.name}
                    className="w-full h-full border-none rounded-md" 
                 />
             ) : (
                 <img 
                    src={previewFile?.url} 
                    alt={previewFile?.name} 
                    className="max-w-full max-h-full object-contain rounded-md shadow-sm" 
                 />
             )}
          </div>
          <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0 bg-background safe-area-bottom">
            <Button variant="outline" className="w-full" onClick={() => window.open(previewFile?.url, '_blank')}>
                Open Original
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpenseDetailsDialog;