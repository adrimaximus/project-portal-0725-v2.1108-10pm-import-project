import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, PaymentStatus, InvoiceAttachment, PAYMENT_STATUS_OPTIONS, Company } from '@/types';
import { DatePicker } from '../ui/date-picker';
import { CurrencyInput } from '../ui/currency-input';
import { Input } from '../ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Paperclip, X, Loader2, Plus, Wand2, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { v4 as uuidv4 } from 'uuid';

type SplitInvoice = {
  id?: string;
  client_company_id: string | null;
  amount: number | null;
  invoice_number: string;
  po_number: string;
  payment_status: PaymentStatus;
  payment_due_date?: Date;
  paid_date?: Date;
  email_sending_date?: Date;
  hardcopy_sending_date?: Date;
  channel: string;
  payment_terms: any[];
  attachments: InvoiceAttachment[];
  new_attachments: File[];
  attachments_to_remove: string[];
};

interface ManageBillingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const ManageBillingDialog = ({ isOpen, onClose, project }: ManageBillingDialogProps) => {
  const queryClient = useQueryClient();
  const [splitInvoices, setSplitInvoices] = useState<SplitInvoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const { data: existingSplits, isLoading: isLoadingSplits } = useQuery({
    queryKey: ['split_invoices', project?.id],
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase.from('split_invoices').select('*, invoice_attachments(*)').eq('project_id', project.id);
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!project,
  });

  useEffect(() => {
    if (isOpen && project) {
      if (existingSplits && existingSplits.length > 0) {
        setSplitInvoices(existingSplits.map(s => ({
          id: s.id,
          client_company_id: s.client_company_id,
          amount: s.amount,
          invoice_number: s.invoice_number || '',
          po_number: s.po_number || '',
          payment_status: s.payment_status as PaymentStatus,
          payment_due_date: s.payment_due_date ? new Date(s.payment_due_date) : undefined,
          paid_date: s.paid_date ? new Date(s.paid_date) : undefined,
          email_sending_date: s.email_sending_date ? new Date(s.email_sending_date) : undefined,
          hardcopy_sending_date: s.hardcopy_sending_date ? new Date(s.hardcopy_sending_date) : undefined,
          channel: s.channel || '',
          payment_terms: s.payment_terms || [],
          attachments: s.invoice_attachments || [],
          new_attachments: [],
          attachments_to_remove: [],
        })));
      } else if (!isLoadingSplits) {
        setSplitInvoices([{
          client_company_id: project.client_company_id || null,
          amount: project.budget || null,
          invoice_number: '', po_number: '', payment_status: 'Unpaid',
          attachments: [], new_attachments: [], attachments_to_remove: [],
          payment_terms: [], channel: ''
        }]);
      }
    }
  }, [isOpen, project, existingSplits, isLoadingSplits]);

  const totalAllocated = useMemo(() => splitInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0), [splitInvoices]);
  const remainingToAllocate = (project?.budget || 0) - totalAllocated;

  const handleSplitChange = (index: number, field: keyof SplitInvoice, value: any) => {
    const newSplits = [...splitInvoices];
    (newSplits[index] as any)[field] = value;
    setSplitInvoices(newSplits);
  };

  const addSplit = () => {
    setSplitInvoices([...splitInvoices, {
      client_company_id: null, amount: null, invoice_number: '', po_number: '',
      payment_status: 'Unpaid', attachments: [], new_attachments: [], attachments_to_remove: [],
      payment_terms: [], channel: ''
    }]);
  };

  const removeSplit = (index: number) => {
    setSplitInvoices(splitInvoices.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!project) return;
    setIsProcessing(true);
    try {
      const upsertPayload = splitInvoices.map(split => ({
        id: split.id,
        client_company_id: split.client_company_id,
        amount: split.amount,
        invoice_number: split.invoice_number,
        po_number: split.po_number,
        payment_status: split.payment_status,
        payment_due_date: split.payment_due_date?.toISOString(),
        paid_date: split.paid_date?.toISOString(),
        email_sending_date: split.email_sending_date?.toISOString(),
        hardcopy_sending_date: split.hardcopy_sending_date?.toISOString(),
        channel: split.channel,
        payment_terms: split.payment_terms,
      }));

      const { error: rpcError } = await supabase.rpc('upsert_split_invoices', {
        p_project_id: project.id,
        p_invoices: upsertPayload,
      });
      if (rpcError) throw rpcError;

      toast.success("Billing information saved successfully.");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['split_invoices', project.id] });
      onClose();
    } catch (error: any) {
      toast.error("Failed to save billing information.", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Billing for "{project.name}"</DialogTitle>
          <DialogDescription>Split the project budget across multiple invoices and companies.</DialogDescription>
        </DialogHeader>
        <div className="border-t -mx-6 px-6 py-3 bg-muted/50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="font-medium">Total Budget:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(project.budget || 0)}</div>
            <div><span className="font-medium">Allocated:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAllocated)}</div>
            <div className={remainingToAllocate < 0 ? 'text-destructive' : ''}><span className="font-medium">Remaining:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(remainingToAllocate)}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          {splitInvoices.map((split, index) => (
            <Collapsible key={index} defaultOpen className="border rounded-lg">
              <CollapsibleTrigger className="w-full p-3 flex justify-between items-center bg-muted/30 hover:bg-muted/60">
                <span className="font-semibold">
                  Invoice {index + 1}: {companies.find(c => c.id === split.client_company_id)?.name || 'Unassigned'}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeSplit(index); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Billed To</Label>
                    <Select value={split.client_company_id || ''} onValueChange={(val) => handleSplitChange(index, 'client_company_id', val)}>
                      <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (Rp)</Label>
                    <CurrencyInput value={split.amount} onChange={(val) => handleSplitChange(index, 'amount', val)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice #</Label>
                    <Input value={split.invoice_number} onChange={(e) => handleSplitChange(index, 'invoice_number', e.target.value)} />
                  </div>
                  <div>
                    <Label>PO #</Label>
                    <Input value={split.po_number} onChange={(e) => handleSplitChange(index, 'po_number', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Status</Label>
                    <Select value={split.payment_status} onValueChange={(val) => handleSplitChange(index, 'payment_status', val as PaymentStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Due Date</Label>
                    <DatePicker date={split.payment_due_date} onDateChange={(date) => handleSplitChange(index, 'payment_due_date', date)} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          <Button variant="outline" onClick={addSplit} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Split
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Billing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};