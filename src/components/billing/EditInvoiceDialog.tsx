import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, PaymentStatus, InvoiceAttachment, PAYMENT_STATUS_OPTIONS } from '@/types';
import { DatePicker } from '../ui/date-picker';
import { CurrencyInput } from '../ui/currency-input';
import { Input } from '../ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Paperclip, X, Loader2, Plus, Wand2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

type Invoice = {
  id: string;
  projectName: string;
  rawProjectId: string;
};

interface EditInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  project: Project | null;
}

type Term = {
  amount: number | null;
  date: Date | undefined;
};

const channelOptions = [
  'Email',
  'JNE TIKI',
  'Kurir',
  'Lalamove',
  'Portal',
  'Rex',
];

const toRoman = (num: number) => {
    const roman: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
};

export const EditInvoiceDialog = ({ isOpen, onClose, invoice, project }: EditInvoiceDialogProps) => {
  const queryClient = useQueryClient();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<PaymentStatus>('Unpaid');
  const [paidDate, setPaidDate] = useState<Date | undefined>();
  const [emailSendingDate, setEmailSendingDate] = useState<Date | undefined>();
  const [hardcopySendingDate, setHardcopySendingDate] = useState<Date | undefined>();
  const [channel, setChannel] = useState('');
  
  const [terms, setTerms] = useState<Term[]>([{ amount: null, date: undefined }]);
  
  const [currentAttachments, setCurrentAttachments] = useState<InvoiceAttachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (invoice && project) {
      setInvoiceNumber(project.invoice_number || invoice.id);
      setPoNumber(project.po_number || '');
      setAmount(project.budget || 0);
      setStatus(project.payment_status as PaymentStatus || 'Unpaid');
      setPaidDate(project.paid_date ? new Date(project.paid_date) : undefined);
      setEmailSendingDate(project.email_sending_date ? new Date(project.email_sending_date) : undefined);
      setHardcopySendingDate(project.hardcopy_sending_date ? new Date(project.hardcopy_sending_date) : undefined);
      setChannel(project.channel || '');
      
      setCurrentAttachments(project.invoice_attachments || []);
      setNewAttachments([]);
      setAttachmentsToRemove([]);

      if (project.payment_terms && Array.isArray(project.payment_terms) && project.payment_terms.length > 0) {
        setTerms(project.payment_terms.map(t => ({
            amount: t.amount || null,
            date: t.date ? new Date(t.date) : undefined
        })));
      } else {
        setTerms([{ amount: null, date: undefined }]);
      }
    }
  }, [invoice, project, isOpen]);

  const balance = useMemo(() => {
    const totalAmount = amount || 0;
    const totalPaid = terms.reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
    return totalAmount - totalPaid;
  }, [amount, terms]);

  const handleGenerateInvoiceNumber = async () => {
    if (!project) return;
    setIsGenerating(true);
    try {
        const clientName = project.client_company_name || project.client_name || '';
        const projectKeywords = project.name.split(' ').slice(0, 3).join(' ');

        let sequence = 1;
        if (project.client_company_id) {
            const { count, error } = await supabase
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('client_company_id', project.client_company_id)
                .not('invoice_number', 'is', null);

            if (error) throw error;
            sequence = (count || 0) + 1;
        } else {
            sequence = 1;
            toast.info("Could not determine invoice sequence automatically.", {
                description: "This project is not linked to a company record. The sequence number has been set to 1."
            });
        }

        const now = new Date();
        const monthRoman = toRoman(now.getMonth() + 1);
        const yearShort = now.getFullYear().toString().slice(-2);

        const invoicePrefix = clientName ? `${clientName} ` : '';
        const newInvoiceNumber = `INV/${invoicePrefix}${projectKeywords}-${sequence}/${monthRoman}/${yearShort}`;
        setInvoiceNumber(newInvoiceNumber);
        toast.success("Invoice number generated!");

    } catch (error: any) {
        toast.error("Failed to generate invoice number.", { description: error.message });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleTermChange = (index: number, field: 'amount' | 'date', value: number | null | Date | undefined) => {
    const newTerms = [...terms];
    const termToUpdate = { ...newTerms[index] };
    
    if (field === 'amount') {
      termToUpdate.amount = value as number | null;
    } else if (field === 'date') {
      termToUpdate.date = value as Date | undefined;
    }
    
    newTerms[index] = termToUpdate;
    setTerms(newTerms);
  };

  const addTerm = () => {
    setTerms([...terms, { amount: null, date: undefined }]);
  };

  const removeTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveCurrentAttachment = (attachmentId: string) => {
    setAttachmentsToRemove(prev => [...prev, attachmentId]);
    setCurrentAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleRemoveNewAttachment = (fileToRemove: File) => {
    setNewAttachments(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleSave = async () => {
    if (!project) return;
    setIsProcessing(true);

    try {
      const processedTerms = terms
        .map(term => ({
            amount: Number(term.amount) || 0,
            date: term.date ? term.date.toISOString() : null,
        }))
        .filter(term => term.amount > 0 || term.date);

      const projectUpdatePayload = {
        invoice_number: invoiceNumber,
        po_number: poNumber || null,
        budget: amount,
        payment_status: status,
        paid_date: status === 'Paid' && paidDate ? paidDate.toISOString() : null,
        email_sending_date: emailSendingDate ? emailSendingDate.toISOString() : null,
        hardcopy_sending_date: hardcopySendingDate ? hardcopySendingDate.toISOString() : null,
        channel: channel || null,
        payment_terms: processedTerms,
      };

      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update(projectUpdatePayload)
        .eq('id', project.id);
      
      if (projectUpdateError) throw projectUpdateError;

      if (attachmentsToRemove.length > 0) {
        const attachmentsToDelete = project.invoice_attachments?.filter(att => attachmentsToRemove.includes(att.id));
        if (attachmentsToDelete && attachmentsToDelete.length > 0) {
          const storagePaths = attachmentsToDelete.map(att => att.storage_path).filter(Boolean);
          if (storagePaths.length > 0) {
            await supabase.storage.from('project-files').remove(storagePaths);
          }
          const { error: deleteError } = await supabase.from('invoice_attachments').delete().in('id', attachmentsToRemove);
          if (deleteError) throw deleteError;
        }
      }

      if (newAttachments.length > 0) {
        toast.info(`Uploading ${newAttachments.length} attachment(s)...`);
        const uploadPromises = newAttachments.map(file => {
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `invoice-attachments/${project.id}/${Date.now()}-${sanitizedFileName}`;
          return supabase.storage.from('project-files').upload(filePath, file).then(result => {
            if (result.error) throw result.error;
            return { ...result, filePath, originalFile: file };
          });
        });

        const uploadResults = await Promise.all(uploadPromises);

        const newAttachmentRecords = uploadResults.map(result => {
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(result.filePath);
          return {
            project_id: project.id,
            file_name: result.originalFile.name,
            file_url: urlData.publicUrl,
            storage_path: result.data.path,
            file_type: result.originalFile.type,
            file_size: result.originalFile.size,
          };
        });

        const { error: insertError } = await supabase.from('invoice_attachments').insert(newAttachmentRecords);
        if (insertError) throw insertError;
      }

      toast.success('Invoice updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    } catch (error: any) {
      toast.error('An error occurred', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!invoice || !project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update details for invoice related to project "{invoice.projectName}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceNumber" className="text-right">
              Invoice #
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" onClick={handleGenerateInvoiceNumber} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="poNumber" className="text-right">
              PO
            </Label>
            <Input
              id="poNumber"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="col-span-3"
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount (Rp)
            </Label>
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Balance (Rp)</Label>
            <Input value={balance.toLocaleString('id-ID')} className="col-span-3 bg-muted" readOnly />
          </div>

          {terms.map((term, index) => (
            <div key={index} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`term-amount-${index}`} className="text-right">
                Paid Term {index + 1}
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <CurrencyInput
                  id={`term-amount-${index}`}
                  value={term.amount}
                  onChange={(value) => handleTermChange(index, 'amount', value)}
                  placeholder="Amount"
                />
                <DatePicker
                  date={term.date}
                  onDateChange={(date) => handleTermChange(index, 'date', date)}
                />
                {index === terms.length - 1 && (
                  <Button type="button" size="icon" variant="outline" onClick={addTerm}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                {terms.length > 1 && (
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeTerm(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === 'Paid' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidDate" className="text-right">
                Paid Date
              </Label>
              <div className="col-span-3">
                <DatePicker date={paidDate} onDateChange={setPaidDate} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emailSendingDate" className="text-right">
              Email Sending
            </Label>
            <div className="col-span-3">
              <DatePicker date={emailSendingDate} onDateChange={setEmailSendingDate} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hardcopySendingDate" className="text-right">
              Hardcopy/Approved
            </Label>
            <div className="col-span-3">
              <DatePicker date={hardcopySendingDate} onDateChange={setHardcopySendingDate} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="channel" className="text-right">
              Channel
            </Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {channelOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label htmlFor="attachment" className="text-right pt-2">
              Attachments
            </Label>
            <div className="col-span-3 space-y-2">
              {currentAttachments.map(att => (
                <div key={att.id} className="flex items-center justify-between text-sm p-2 border rounded-md bg-muted/50">
                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={att.file_name}>{att.file_name}</span>
                  </a>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleRemoveCurrentAttachment(att.id)} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {newAttachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleRemoveNewAttachment(file)} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div>
                <Input id="attachment" type="file" multiple onChange={handleFileChange} className="text-sm" disabled={isProcessing} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};