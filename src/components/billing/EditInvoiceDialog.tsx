import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from '@/components/ui/date-picker';
import { PAYMENT_STATUS_OPTIONS, Project, PaymentStatus } from '@/types';

type Invoice = {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  rawProjectId: string;
};

interface EditInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  project: Project | null;
  onSave: (updatedProject: Partial<Project> & { id: string }) => void;
}

export const EditInvoiceDialog = ({ isOpen, onClose, invoice, project, onSave }: EditInvoiceDialogProps) => {
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<PaymentStatus>('Unpaid');
  const [projectDueDate, setProjectDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (invoice && project) {
      setAmount(invoice.amount);
      setStatus(invoice.status);
      setProjectDueDate(project.due_date ? new Date(project.due_date) : undefined);
    }
  }, [invoice, project]);

  const handleSave = () => {
    if (invoice && project) {
      onSave({
        id: project.id,
        budget: amount,
        payment_status: status,
        due_date: projectDueDate ? projectDueDate.toISOString() : project.due_date,
      });
      onClose();
    }
  };

  if (!invoice || !project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Invoice {invoice.id}</DialogTitle>
          <DialogDescription>
            Changes made here will update the details for the project: <strong>{invoice.projectName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount</Label>
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-due-date" className="text-right">Project Due Date</Label>
            <div className="col-span-3">
              <DatePicker date={projectDueDate} onDateChange={setProjectDueDate} />
              <p className="text-xs text-muted-foreground mt-1">Invoice due date is 30 days after this.</p>
            </div>
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