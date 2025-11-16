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
import { CalendarIcon, Loader2, Check, ChevronsUpDown, User, Building, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Project } from '@/types';
import { CurrencyInput } from '../ui/currency-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '../ui/label';
import BankAccountFormDialog from './BankAccountFormDialog';

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
}

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const expenseSchema = z.object({
  project_id: z.string().uuid("Please select a project."),
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
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const AddExpenseDialog = ({ open, onOpenChange }: AddExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [beneficiaryPopoverOpen, setBeneficiaryPopoverOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState<{ id: string, name: string, type: 'person' | 'company' } | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [isBankAccountFormOpen, setIsBankAccountFormOpen] = useState(false);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projectsForExpenseForm'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: beneficiaries = [], isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, full_name');
      if (peopleError) throw peopleError;

      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name');
      if (companiesError) throw companiesError;

      const formattedPeople = people.map(p => ({ id: p.id, name: p.full_name, type: 'person' as const }));
      const formattedCompanies = companies.map(c => ({ id: c.id, name: c.name, type: 'company' as const }));

      return [...formattedPeople, ...formattedCompanies].sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: open,
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      project_id: '',
      beneficiary: '',
      tf_amount: 0,
      payment_terms: [{ amount: null, request_type: 'Requested', request_date: undefined, release_date: undefined, status: 'Pending' }],
      bank_account_id: null,
      remarks: '',
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "payment_terms",
  });

  const paymentTerms = watch("payment_terms");
  const totalAmount = watch("tf_amount");

  const balance = useMemo(() => {
    const totalPaid = (paymentTerms || []).reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
    return (totalAmount || 0) - totalPaid;
  }, [totalAmount, paymentTerms]);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (beneficiary) {
        setIsLoadingBankAccounts(true);
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('id, account_name, account_number, bank_name')
          .eq('owner_id', beneficiary.id)
          .ilike('owner_type', beneficiary.type);
        
        if (error) {
          toast.error("Failed to fetch bank accounts.");
        } else {
          setBankAccounts(data);
          if (data.length > 0) {
            setValue('bank_account_id', data[0].id);
          } else {
            setValue('bank_account_id', null);
          }
        }
        setIsLoadingBankAccounts(false);
      } else {
        setBankAccounts([]);
        setValue('bank_account_id', null);
      }
    };
    fetchBankAccounts();
  }, [beneficiary, setValue]);

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add an expense.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        project_id: values.project_id,
        created_by: user.id,
        beneficiary: values.beneficiary,
        tf_amount: values.tf_amount,
        payment_terms: values.payment_terms?.map(term => ({
            amount: term.amount || 0,
            request_type: term.request_type,
            request_date: term.request_date ? term.request_date.toISOString() : null,
            release_date: term.release_date ? term.release_date.toISOString() : null,
            status: term.status || 'Pending',
        })).filter(term => term.amount > 0 || term.request_date || term.release_date),
        bank_account_id: values.bank_account_id,
        remarks: values.remarks,
      });

      if (error) throw error;

      toast.success("Expense added successfully.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
      form.reset();
      setBeneficiary(null);
    } catch (error: any) {
      toast.error("Failed to add expense.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Fill in the details for the new expense record.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
              {/* Project and Beneficiary selectors */}
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
              <FormField
                control={form.control}
                name="beneficiary"
                render={({ field }) => (
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
                          <CommandInput placeholder="Search beneficiary..." />
                          <CommandList>
                            <CommandEmpty>No beneficiary found.</CommandEmpty>
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
                )}
              />
              {/* Bank Account Selection */}
              <FormField
                control={form.control}
                name="bank_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!beneficiary || isLoadingBankAccounts}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingBankAccounts ? "Loading accounts..." : "Select a bank account"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.bank_name} - {account.account_number} ({account.account_name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setIsBankAccountFormOpen(true)} disabled={!beneficiary}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Rest of the form */}
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-7 w-7">
                          <X className="h-4 w-4" />
                        </Button>
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
                <Label className="text-right">Balance (Rp)</Label>
                <Input value={balance.toLocaleString('id-ID')} className="col-span-3 bg-muted" readOnly />
              </div>
              <FormField control={form.control} name="remarks" render={({ field }) => (
                <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Expense
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
              const { data, error } = await supabase
                .from('bank_accounts')
                .select('id, account_name, account_number, bank_name')
                .eq('owner_id', beneficiary.id)
                .eq('owner_type', beneficiary.type);
              if (data) {
                setBankAccounts(data);
                setValue('bank_account_id', newAccountId);
              }
            };
            fetchNewAccounts();
          }}
        />
      )}
    </>
  );
};

export default AddExpenseDialog;