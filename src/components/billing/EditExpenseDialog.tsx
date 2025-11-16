import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Check, ChevronsUpDown, User, Building, Plus, X, Copy, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, Person, Company, Expense } from '@/types';
import { CurrencyInput } from '../ui/currency-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '../ui/label';
import BankAccountFormDialog from './BankAccountFormDialog';
import BeneficiaryTypeDialog from './BeneficiaryTypeDialog';
import PersonFormDialog from '../people/PersonFormDialog';
import CompanyFormDialog from '../people/CompanyFormDialog';

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  is_legacy: boolean;
}

const expenseSchema = z.object({
  project_id: z.string().uuid("Project is required."),
  beneficiary: z.string().min(1, "Beneficiary is required."),
  tf_amount: z.number().min(1, "Amount must be greater than 0."),
  payment_terms: z.array(z.object({
    amount: z.number().nullable(),
    request_type: z.string().optional(),
    request_date: z.date().optional().nullable(),
    release_date: z.date().optional().nullable(),
    status: z.string().optional(),
  })).optional(),
  bank_account_id: z.string().uuid("Please select a bank account.").optional().nullable(),
  remarks: z.string().optional(),
  status_expense: z.string().min(1, "Status is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ProjectOption {
  id: string;
  name: string;
}

const EditExpenseDialog = ({ open, onOpenChange, expense }: { open: boolean, onOpenChange: (open: boolean) => void, expense: Expense | null }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [beneficiaryPopoverOpen, setBeneficiaryPopoverOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState<{ id: string, name: string, type: 'person' | 'company' } | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [isBankAccountFormOpen, setIsBankAccountFormOpen] = useState(false);
  const [beneficiarySearch, setBeneficiarySearch] = useState('');

  const [isBeneficiaryTypeDialogOpen, setIsBeneficiaryTypeDialogOpen] = useState(false);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectOption[]>({
    queryKey: ['projectsForExpenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: beneficiaries = [], isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const { data: people, error: peopleError } = await supabase.from('people').select('id, full_name');
      if (peopleError) throw peopleError;
      const { data: companies, error: companiesError } = await supabase.from('companies').select('id, name');
      if (companiesError) throw companiesError;
      const formattedPeople = people.map(p => ({ id: p.id, name: p.full_name, type: 'person' as const }));
      const formattedCompanies = companies.map(c => ({ id: c.id, name: c.name, type: 'company' as const }));
      return [...formattedPeople, ...formattedCompanies].sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: open,
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });

  const { control, handleSubmit, watch, setValue, reset } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "payment_terms" });

  const paymentTerms = watch("payment_terms");
  const totalAmount = watch("tf_amount");

  const unallocatedBalance = useMemo(() => {
    const totalAllocated = (paymentTerms || []).reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
    return (totalAmount || 0) - totalAllocated;
  }, [totalAmount, paymentTerms]);

  const outstandingBalance = useMemo(() => {
    const totalPaid = (paymentTerms || [])
      .filter(term => term.status === 'Paid')
      .reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
    return (totalAmount || 0) - totalPaid;
  }, [totalAmount, paymentTerms]);

  useEffect(() => {
    if (expense && beneficiaries.length > 0 && projects.length > 0) {
      const foundBeneficiary = beneficiaries.find(b => b.name === expense.beneficiary);
      if (foundBeneficiary) {
        setBeneficiary(foundBeneficiary);
      }
      reset({
        project_id: expense.project_id,
        beneficiary: expense.beneficiary,
        tf_amount: expense.tf_amount,
        status_expense: expense.status_expense,
        remarks: expense.remarks || "",
        payment_terms: (expense as any).payment_terms?.map((t: any) => ({
          ...t,
          request_date: t.request_date ? new Date(t.request_date) : undefined,
          release_date: t.release_date ? new Date(t.release_date) : undefined,
        })) || [{ amount: null, request_type: 'Requested', request_date: undefined, release_date: undefined, status: 'Pending' }],
        bank_account_id: (expense as any).bank_account_id || null,
      });
    }
  }, [expense, beneficiaries, projects, reset, open]);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (beneficiary) {
        setIsLoadingBankAccounts(true);
        const { data, error } = await supabase.rpc('get_beneficiary_bank_accounts', { p_owner_id: beneficiary.id, p_owner_type: beneficiary.type });
        if (error) {
          toast.error("Failed to fetch bank accounts.");
          setBankAccounts([]);
        } else {
          setBankAccounts(data || []);
        }
        setIsLoadingBankAccounts(false);
      } else {
        setBankAccounts([]);
        setValue('bank_account_id', null);
      }
    };
    fetchBankAccounts();
  }, [beneficiary, setValue]);

  const handleCreateNewBeneficiary = (name: string) => {
    setNewBeneficiaryName(name);
    setBeneficiaryPopoverOpen(false);
    setIsBeneficiaryTypeDialogOpen(true);
  };

  const handleSelectBeneficiaryType = (type: 'person' | 'company') => {
    setIsBeneficiaryTypeDialogOpen(false);
    if (type === 'person') setIsPersonFormOpen(true);
    else setIsCompanyFormOpen(true);
  };

  const handleBeneficiaryCreated = (newItem: Person | Company, type: 'person' | 'company') => {
    queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    const beneficiaryData = { id: newItem.id, name: type === 'person' ? (newItem as Person).full_name : (newItem as Company).name, type };
    setBeneficiary(beneficiaryData);
    form.setValue('beneficiary', beneficiaryData.name);
    setIsBankAccountFormOpen(true);
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!expense) return;
    setIsSubmitting(true);
    try {
      const selectedAccount = bankAccounts.find(acc => acc.id === values.bank_account_id);
      let bankDetails = null;
      if (selectedAccount) {
        bankDetails = { name: selectedAccount.account_name, account: selectedAccount.account_number, bank: selectedAccount.bank_name };
      } else if (values.bank_account_id && expense?.account_bank) {
        // Preserve existing bank details if the selection hasn't changed but the list isn't loaded yet
        bankDetails = expense.account_bank;
      }

      const { error } = await supabase.from('expenses').update({
        project_id: values.project_id,
        beneficiary: values.beneficiary,
        tf_amount: values.tf_amount,
        payment_terms: values.payment_terms?.map(term => ({
            ...term,
            request_date: term.request_date ? term.request_date.toISOString() : null,
            release_date: term.release_date ? term.release_date.toISOString() : null,
        })),
        bank_account_id: (selectedAccount && !selectedAccount.is_legacy) ? selectedAccount.id : null,
        account_bank: bankDetails,
        remarks: values.remarks,
        status_expense: values.status_expense,
      }).eq('id', expense.id);

      if (error) throw error;
      toast.success("Expense updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update expense.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameParts = newBeneficiaryName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the details for this expense record.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Project</FormLabel>
                    <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={isLoadingProjects}>
                            {field.value ? projects.find((project) => project.id === field.value)?.name : "Select a project"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search project..." />
                          <CommandList>
                            <CommandEmpty>No project found.</CommandEmpty>
                            <CommandGroup>
                              {projects.map((project) => (
                                <CommandItem value={project.name} key={project.id} onSelect={() => { form.setValue("project_id", project.id); setProjectPopoverOpen(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", project.id === field.value ? "opacity-100" : "opacity-0")} />
                                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {project.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="beneficiary" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Beneficiary</FormLabel>
                  <Popover open={beneficiaryPopoverOpen} onOpenChange={setBeneficiaryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={isLoadingBeneficiaries}>
                          {field.value || "Select a beneficiary"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search beneficiary..." value={beneficiarySearch} onValueChange={setBeneficiarySearch} />
                        <CommandList>
                          <CommandEmpty>
                            <Button variant="ghost" className="w-full justify-start" onClick={() => handleCreateNewBeneficiary(beneficiarySearch)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create "{beneficiarySearch}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {beneficiaries.map((item) => (
                              <CommandItem value={item.name} key={item.id} onSelect={() => { form.setValue("beneficiary", item.name); setBeneficiary(item); setBeneficiaryPopoverOpen(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", item.name === field.value ? "opacity-100" : "opacity-0")} />
                                {item.type === 'person' ? <User className="mr-2 h-4 w-4 text-muted-foreground" /> : <Building className="mr-2 h-4 w-4 text-muted-foreground" />}
                                <span className="flex-grow">{item.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bank_account_id" render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Bank Account</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsBankAccountFormOpen(true)} disabled={!beneficiary}>
                      <Plus className="mr-2 h-4 w-4" /> Add New
                    </Button>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      {isLoadingBankAccounts ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading accounts...</span></div>
                      ) : bankAccounts.length > 0 ? (
                        bankAccounts.map(account => (
                          <div key={account.id} onClick={() => field.onChange(account.id)} className={cn("border rounded-lg p-3 cursor-pointer transition-all", field.value === account.id ? "border-primary ring-2 ring-primary ring-offset-2" : "hover:border-primary/50")}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-grow">
                                <p className="font-semibold">{account.bank_name}</p>
                                <p className="text-muted-foreground">{account.account_number}</p>
                                <p className="text-sm text-muted-foreground">{account.account_name}</p>
                              </div>
                              <div className="flex items-center shrink-0">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${account.bank_name}\n${account.account_number}\n${account.account_name}`); toast.success("Bank details copied!"); }}><Copy className="h-4 w-4" /></Button>
                                {field.value === account.id && <Check className="h-4 w-4 text-primary ml-1" />}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-lg">No bank accounts found for this beneficiary.</div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tf_amount" render={({ field }) => (
                <FormItem><FormLabel>Total Amount</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
              <div>
                <FormLabel>Payment Terms</FormLabel>
                <div className="space-y-3 mt-2">
                  {fields.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">Term {index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-7 w-7"><X className="h-4 w-4" /></Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField control={form.control} name={`payment_terms.${index}.amount`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Amount</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} placeholder="Amount" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`payment_terms.${index}.request_date`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Requested/Due Date</FormLabel><div className="flex gap-1">
                            <FormField control={form.control} name={`payment_terms.${index}.request_type`} render={({ field: typeField }) => (
                              <FormItem><Select onValueChange={typeField.onChange} defaultValue={typeField.value}><FormControl><SelectTrigger className="w-[110px] bg-background"><SelectValue placeholder="Type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Requested">Requested</SelectItem><SelectItem value="Due">Due</SelectItem></SelectContent></Select></FormItem>
                            )} />
                            <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("flex-1 w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                          </div><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name={`payment_terms.${index}.release_date`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Release Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`payment_terms.${index}.status`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ amount: null, request_type: 'Requested', request_date: undefined, release_date: undefined, status: 'Pending' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Term
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Outstanding (Rp)</Label>
                <Input value={outstandingBalance.toLocaleString('id-ID')} className="col-span-3 bg-muted" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Unallocated (Rp)</Label>
                <Input value={unallocatedBalance.toLocaleString('id-ID')} className={cn("col-span-3 bg-muted", unallocatedBalance !== 0 && "text-red-500 font-semibold")} readOnly />
              </div>
              <FormField
                control={form.control}
                name="status_expense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Proposed">Proposed</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="remarks" render={({ field }) => (
                <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </form>
          </Form>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="expense-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {beneficiary && (
        <BankAccountFormDialog
          open={isBankAccountFormOpen}
          onOpenChange={setIsBankAccountFormOpen}
          ownerId={beneficiary.id}
          ownerType={beneficiary.type}
          onSuccess={(newAccountId) => {
            const fetchNewAccounts = async () => {
              const { data, error } = await supabase.rpc('get_beneficiary_bank_accounts', {
                p_owner_id: beneficiary!.id,
                p_owner_type: beneficiary!.type,
              });
              if (data) {
                setBankAccounts(data);
                setValue('bank_account_id', newAccountId);
              }
            };
            fetchNewAccounts();
          }}
        />
      )}
      <BeneficiaryTypeDialog open={isBeneficiaryTypeDialogOpen} onOpenChange={setIsBeneficiaryTypeDialogOpen} onSelect={handleSelectBeneficiaryType} />
      <PersonFormDialog open={isPersonFormOpen} onOpenChange={setIsPersonFormOpen} person={null} initialValues={{ first_name: firstName, last_name: lastName }} onSuccess={(newPerson) => handleBeneficiaryCreated(newPerson, 'person')} />
      <CompanyFormDialog open={isCompanyFormOpen} onOpenChange={setIsCompanyFormOpen} company={null} initialValues={{ name: newBeneficiaryName }} onSuccess={(newCompany) => handleBeneficiaryCreated(newCompany, 'company')} />
    </>
  );
};

export default EditExpenseDialog;