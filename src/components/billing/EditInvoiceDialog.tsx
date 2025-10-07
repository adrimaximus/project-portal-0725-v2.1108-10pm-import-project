import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, PaymentStatus } from '@/types';
import { DatePicker } from '../ui/date-picker';
import { NumericInput } from '../ui/NumericInput';
import { Input } from '../ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Paperclip, X, Loader2 } from 'lucide-react';

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
  onSave: (updatedProjectData: Partial<Project> & { id: string }) => void;
}

const paymentStatuses: PaymentStatus[] = ['Paid', 'Unpaid', 'Pending', 'Overdue', 'Cancelled', 'In Process'];
const channelOptions = ['Email', 'Gojek', 'Grab', 'JNE', 'Lalamove', 'Portal', 'Rex', 'TIKI'].sort();

export const EditInvoiceDialog = ({ isOpen, onClose, invoice, project, onSave }: EditInvoiceDialogProps) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<PaymentStatus>('Unpaid');
  const [paidDate, setPaidDate] = useState<Date | undefined>();
  const [emailSendingDate, setEmailSendingDate] = useState<Date | undefined>();
  const [hardcopySendingDate, setHardcopySendingDate] = useState<Date | undefined>();
  const [channel, setChannel] = useState('');
  
  const [newAttachment, setNewAttachment] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAttachmentUrl, setCurrentAttachmentUrl] = useState<string | null>(null);
  const [currentAttachmentName, setCurrentAttachmentName] = useState<string | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  useEffect(() => {
    if (invoice && project) {
      setInvoiceNumber(project.invoice_number || invoice.id);
      setPoNumber(project.po_number || '');
      setAmount(project.budget || 0);
      setStatus(project.payment_status || 'Unpaid');
      setPaidDate(project.paid_date ? new Date(project.paid_date) : undefined);
      setEmailSendingDate(project.email_sending_date ? new Date(project.email_sending_date) : undefined);
      setHardcopySendingDate(project.hardcopy_sending_date ? new Date(project.hardcopy_sending_date) : undefined);
      setChannel(project.channel || '');
      
      setCurrentAttachmentUrl(project.invoice_attachment_url || null);
      setCurrentAttachmentName(project.invoice_attachment_name || null);
      setNewAttachment(null);
      setRemoveAttachment(false);
    }
  }, [invoice, project, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAttachment(e.target.files[0]);
      setRemoveAttachment(false);
      setCurrentAttachmentUrl(null);
      setCurrentAttachmentName(null);
    }
  };

  const handleRemoveCurrentAttachment = () => {
    setRemoveAttachment(true);
    setCurrentAttachmentUrl(null);
    setCurrentAttachmentName(null);
  };

  const handleRemoveNewAttachment = () => {
    setNewAttachment(null);
    if (project?.invoice_attachment_url) {
      setCurrentAttachmentUrl(project.invoice_attachment_url);
      setCurrentAttachmentName(project.invoice_attachment_name);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    setIsProcessing(true);

    try {
      onSave({
        id: project.id,
        invoice_number: invoiceNumber,
        po_number: poNumber || null,
        budget: amount,
        payment_status: status,
        paid_date: status === 'Paid' && paidDate ? paidDate.toISOString() : null,
        email_sending_date: emailSendingDate ? emailSendingDate.toISOString() : null,
        hardcopy_sending_date: hardcopySendingDate ? hardcopySendingDate.toISOString() : null,
        channel: channel || null,
      });

      let attachmentUrl = project.invoice_attachment_url;
      let attachmentName = project.invoice_attachment_name;
      let attachmentUpdated = false;

      if (removeAttachment && project.invoice_attachment_url) {
        const urlParts = project.invoice_attachment_url.split('/billing/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabase.storage.from('billing').remove([oldFilePath]);
        }
        attachmentUrl = null;
        attachmentName = null;
        attachmentUpdated = true;
      }

      if (newAttachment) {
        toast.info('Uploading attachment...');
        const sanitizedFileName = newAttachment.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `invoice-attachments/${project.id}/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('billing')
          .upload(filePath, newAttachment);

        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('billing').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        attachmentName = newAttachment.name;
        attachmentUpdated = true;
      }

      if (attachmentUpdated) {
        const { error } = await supabase
          .from('projects')
          .update({
            invoice_attachment_url: attachmentUrl,
            invoice_attachment_name: attachmentName,
          })
          .eq('id', project.id);
        if (error) throw new Error(`Failed to save attachment details: ${error.message}`);
      }

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
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceNumber" className="text-right">
              Invoice #
            </Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="col-span-3"
            />
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
            <NumericInput
              id="amount"
              value={amount}
              onChange={setAmount}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: PaymentStatus) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
              Attachment
            </Label>
            <div className="col-span-3">
              {currentAttachmentUrl && !removeAttachment && (
                <div className="flex items-center justify-between text-sm p-2 border rounded-md bg-muted/50">
                  <a href={currentAttachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={currentAttachmentName || ''}>{currentAttachmentName}</span>
                  </a>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemoveCurrentAttachment} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {newAttachment && (
                <div className="flex items-center justify-between text-sm p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={newAttachment.name}>{newAttachment.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemoveNewAttachment} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!newAttachment && !currentAttachmentUrl && (
                <Input id="attachment" type="file" onChange={handleFileChange} className="text-sm" disabled={isProcessing} />
              )}
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