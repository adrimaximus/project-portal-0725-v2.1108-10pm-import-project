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
import { Paperclip, X, Loader2, Plus, Wand2, Building, Layers } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CompanySelector from '../people/CompanySelector';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { v4 as uuidv4 } from 'uuid';

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

type SplitInvoice = {
  id: string;
  client_company_id: string | null;
  amount: number | null;
  payment_due_date: Date | undefined;
  invoice_number?: string;
  po_number?: string;
  payment_status?: PaymentStatus;
  paid_date?: Date | undefined;
  email_sending_date?: Date | undefined;
  hardcopy_sending_date?: Date | undefined;
  channel?: string;
  payment_terms?: any[];
};

export const EditInvoiceDialog = ({ isOpen, onClose, invoice, project }: EditInvoiceDialogProps) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [splitMode, setSplitMode] = useState<'term' | 'company'>('term');
  const [splitInvoices, setSplitInvoices] = useState<SplitInvoice[]>([]);

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    const fetchSplitInvoices = async () => {
      if (invoice && project) {
        const { data, error } = await supabase.from('split_invoices').select('*').eq('project_id', project.id);
        if (error) {
          toast.error("Failed to load split invoice details.");
          setSplitInvoices([]);
        } else if (data && data.length > 0) {
          setSplitInvoices(data.map(d => ({
            ...d,
            payment_due_date: d.payment_due_date ? new Date(d.payment_due_date) : undefined,
            paid_date: d.paid_date ? new Date(d.paid_date) : undefined,
            email_sending_date: d.email_sending_date ? new Date(d.email_sending_date) : undefined,
            hardcopy_sending_date: d.hardcopy_sending_date ? new Date(d.hardcopy_sending_date) : undefined,
          })));
          if (data.some(d => d.client_company_id)) {
            setSplitMode('company');
          } else {
            setSplitMode('term');
          }
        } else {
          setSplitInvoices([{
            id: `new-${uuidv4()}`,
            client_company_id: project.client_company_id,
            amount: project.budget,
            payment_due_date: project.payment_due_date ? new Date(project.payment_due_date) : undefined,
            invoice_number: project.invoice_number || '',
            po_number: project.po_number || '',
            payment_status: project.payment_status as PaymentStatus,
            paid_date: project.paid_date ? new Date(project.paid_date) : undefined,
            email_sending_date: project.email_sending_date ? new Date(project.email_sending_date) : undefined,
            hardcopy_sending_date: project.hardcopy_sending_date ? new Date(project.hardcopy_sending_date) : undefined,
            channel: project.channel || '',
            payment_terms: project.payment_terms || [],
          }]);
          setSplitMode('term');
        }
      }
    };

    if (isOpen) {
      fetchSplitInvoices();
    }
  }, [invoice, project, isOpen]);

  const handleSave = async () => {
    if (!project) return;
    setIsProcessing(true);

    const payload = splitInvoices.map(si => ({
      ...si,
      id: si.id.startsWith('new-') ? null : si.id,
      project_id: project.id,
    }));

    try {
      const { error } = await supabase.rpc('upsert_split_invoices', {
        p_project_id: project.id,
        p_invoices: payload,
      });
      if (error) throw error;

      toast.success('Invoice details updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    } catch (error: any) {
      toast.error('An error occurred', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitInvoiceChange = (index: number, field: keyof SplitInvoice, value: any) => {
    const newSplits = [...splitInvoices];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplitInvoices(newSplits);
  };

  const addSplit = () => {
    const newSplit: SplitInvoice = {
      id: `new-${uuidv4()}`,
      client_company_id: null,
      amount: null,
      payment_due_date: undefined,
      payment_status: 'Proposed',
    };
    const newSplits = [...splitInvoices, newSplit];
    
    if (splitMode === 'term' && project?.budget && project.budget > 0) {
        const newCount = newSplits.length;
        const splitAmount = Math.round(project.budget / newCount);
        newSplits.forEach((split, i) => {
            split.amount = i === newCount - 1 ? project.budget - (splitAmount * (newCount - 1)) : splitAmount;
        });
    }

    setSplitInvoices(newSplits);
  };

  const removeSplit = (index: number) => {
    const newSplits = splitInvoices.filter((_, i) => i !== index);
    
    if (splitMode === 'term' && project?.budget && project.budget > 0 && newSplits.length > 0) {
        const newCount = newSplits.length;
        const splitAmount = Math.round(project.budget / newCount);
        newSplits.forEach((split, i) => {
            split.amount = i === newCount - 1 ? project.budget - (splitAmount * (newCount - 1)) : splitAmount;
        });
    }

    setSplitInvoices(newSplits);
  };

  const handleGenerateInvoiceNumber = async (index: number) => {
    if (!project) return;
    setIsGenerating(true);
    try {
        const { data, error } = await supabase.rpc('generate_invoice_number', {
            p_project_id: project.id,
            p_term_index: index,
        });
        if (error) throw error;
        handleSplitInvoiceChange(index, 'invoice_number', data);
        toast.success("Invoice number generated.");
    } catch (error: any) {
        toast.error("Failed to generate invoice number.", { description: error.message });
    } finally {
        setIsGenerating(false);
    }
  };

  const totalAmount = useMemo(() => splitInvoices.reduce((sum, si) => sum + (si.amount || 0), 0), [splitInvoices]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update details for invoice related to project "{invoice?.projectName}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="flex items-center gap-2">
            <Label>Split by:</Label>
            <Button variant={splitMode === 'term' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSplitMode('term')}><Layers className="mr-2 h-4 w-4" /> Term</Button>
            <Button variant={splitMode === 'company' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSplitMode('company')}><Building className="mr-2 h-4 w-4" /> Company</Button>
          </div>
          {splitInvoices.map((split, index) => {
            const company = companies.find(c => c.id === split.client_company_id);
            return (
              <div key={split.id} className="grid grid-cols-4 items-start gap-4 border-t pt-4">
                <div className="text-right flex flex-col items-end gap-2">
                  {splitMode === 'company' ? (
                    <div className="w-full">
                      <CompanySelector value={split.client_company_id} onChange={(val) => handleSplitInvoiceChange(index, 'client_company_id', val)} />
                      {company && (
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <span className="text-xs text-muted-foreground">{company.name}</span>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={company.logo_url || undefined} />
                            <AvatarFallback><Building className="h-3 w-3" /></AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Label htmlFor={`term-amount-${index}`} className="pt-2">
                      Term {index + 1}
                    </Label>
                  )}
                </div>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CurrencyInput
                      id={`term-amount-${index}`}
                      value={split.amount}
                      onChange={(value) => handleSplitInvoiceChange(index, 'amount', value)}
                      placeholder="Amount"
                    />
                    <DatePicker
                      date={split.payment_due_date}
                      onDateChange={(date) => handleSplitInvoiceChange(index, 'payment_due_date', date)}
                    />
                    {index === splitInvoices.length - 1 && (
                      <Button type="button" size="icon" variant="outline" onClick={addSplit}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {splitInvoices.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeSplit(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                        <Input 
                            placeholder="Invoice #" 
                            value={split.invoice_number || ''} 
                            onChange={(e) => handleSplitInvoiceChange(index, 'invoice_number', e.target.value)} 
                        />
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => handleGenerateInvoiceNumber(index)}
                            disabled={isGenerating}
                            title="Generate Invoice Number"
                        >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                    </div>
                    <Input placeholder="PO #" value={split.po_number || ''} onChange={(e) => handleSplitInvoiceChange(index, 'po_number', e.target.value)} />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-4">
            <Label className="text-right font-bold">Total Amount</Label>
            <div className="col-span-3">
              <Input value={`Rp ${totalAmount.toLocaleString('id-ID')}`} readOnly className="font-bold" />
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