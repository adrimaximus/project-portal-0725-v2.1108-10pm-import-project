import { useState, useMemo } from 'react';
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
    date: z.date().optional().nullable(),
    status: z.string().optional(),
  })).optional(),
  status_expense: z.string().min(1, "Status is required."),
  due_date: z.date().optional().nullable(),
  account_name: z.string().optional(),
  account_bank: z.string().optional(),
  account_number: z.string().optional(),
  remarks: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const AddExpenseDialog = ({ open, onOpenChange }: AddExpenseDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [beneficiaryPopoverOpen, setBeneficiaryPopoverOpen] = useState(false);

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

      const formattedPeople = people.map(p => ({ id: `person-${p.id}`, name: p.full_name, type: 'Person' as const }));
      const formattedCompanies = companies.map(c => ({ id: `company-${c.id}`, name: c.name, type: 'Company' as const }));

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
      payment_terms: [{ amount: null, date: undefined, status: 'Pending' }],
      status_expense: 'Pending',
      due_date: null,
      account_name: '',
      account_bank: '',
      account_number: '',
      remarks: '',
    },
  });

  const { control, handleSubmit, watch } = form;
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
            date: term.date ? term.date.toISOString() : null,
            status: term.status || 'Pending',
        })).filter(term => term.amount > 0 || term.date),
        status_expense: values.status_expense,
        due_date: values.due_date ? values.due_date.toISOString() : null,
        account_bank: {
          name: values.account_name,
          bank: values.account_bank,
          account: values.account_number,
        },
        remarks: values.remarks,
      });

      if (error) throw error;

      toast.success("Expense added successfully.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error("Failed to add expense.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>Fill in the details for the new expense record.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project</FormLabel>
                  <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoadingProjects}
                        >
                          {field.value
                            ? projects.find(
                                (project) => project.id === field.value
                              )?.name
                            : "Select a project"}
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
                              <CommandItem
                                value={project.name}
                                key={project.id}
                                onSelect={() => {
                                  form.setValue("project_id", project.id);
                                  setProjectPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    project.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
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
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoadingBeneficiaries}
                        >
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
                              <CommandItem
                                value={item.name}
                                key={item.id}
                                onSelect={() => {
                                  form.setValue("beneficiary", item.name);
                                  setBeneficiaryPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item.name === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {item.type === 'Person' ? <User className="mr-2 h-4 w-4 text-muted-foreground" /> : <Building className="mr-2 h-4 w-4 text-muted-foreground" />}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`payment_terms.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel className="text-xs">Amount</FormLabel>
                            <FormControl>
                              <CurrencyInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`payment_terms.${index}.date`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-xs">Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`payment_terms.${index}.status`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ amount: null, date: undefined, status: 'Pending' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Term
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Balance (Rp)</Label>
              <Input value={balance.toLocaleString('id-ID')} className="col-span-3 bg-muted" readOnly />
            </div>

            <FormField control={form.control} name="status_expense" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
            <div>
              <FormLabel>Bank Account</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <FormField control={form.control} name="account_name" render={({ field }) => (
                  <FormItem><FormControl><Input {...field} placeholder="Account Name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="account_bank" render={({ field }) => (
                  <FormItem><FormControl><Input {...field} placeholder="Bank Name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="account_number" render={({ field }) => (
                  <FormItem><FormControl><Input {...field} placeholder="Account Number" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
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
  );
};

export default AddExpenseDialog;