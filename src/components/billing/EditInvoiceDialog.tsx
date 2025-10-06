import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, PaymentStatus } from '@/types';
import { DatePicker } from '../ui/date-picker';

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
    }
  }, [invoice, project, isOpen]);

  const handleSave = () => {
    if (project) {
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
      onClose();
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
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};