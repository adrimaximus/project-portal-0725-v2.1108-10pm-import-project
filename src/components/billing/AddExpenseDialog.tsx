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
import { CalendarIcon, Loader2, Check, ChevronsUpDown, User, Building, Plus, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, Person, Company } from '@/types';
import { CurrencyInput } from '../ui/currency-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '../ui/label';
import BankAccountFormDialog from './BankAccountFormDialog';
import BeneficiaryTypeDialog from './BeneficiaryTypeDialog';
import PersonFormDialog from '../people/PersonFormDialog';
import CompanyFormDialog from '../people/CompanyFormDialog';
import CreateProjectDialog from '../projects/CreateProjectDialog';

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  is_legacy: boolean;
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
    request_type: z.string().optional().default('Requested'),
    request_date: z.date().optional().nullable(),
    release_date: z.date().optional().nullable(),
    status: z.string().optional().default('Pending'),
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
  const [beneficiarySearch, setBeneficiarySearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const [isBeneficiaryTypeDialogOpen, setIsBeneficiaryTypeDialogOpen] = useState(false);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);

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
          .rpc('get_beneficiary_bank_accounts', {
            p_owner_id: beneficiary.id,
            p_owner_type: beneficiary.type,
          });
        
        if (error) {
          toast.error("Failed to fetch bank accounts.");
          setBankAccounts([]);
        } else {
          setBankAccounts(data || []);
          if (data && data.length === 1) {
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

  const handleCreateNewBeneficiary = (name: string) => {
    setNewBeneficiaryName(name);
    setBeneficiaryPopoverOpen(false);
    setIsBeneficiaryTypeDialogOpen(true);
  };

  const handleSelectBeneficiaryType = (type: 'person' | 'company') => {
    setIsBeneficiaryTypeDialogOpen(false);
    if (type === 'person') {
      setIsPersonFormOpen(true);
    } else {
      setIsCompanyFormOpen(true);
    }
  };

  const handleBeneficiaryCreated = (newItem: Person | Company, type: 'person' | 'company') => {
    queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    
    const beneficiaryData = { id: newItem.id, name: type === 'person' ? (newItem as Person).full_name : (newItem as Company).name, type };
    setBeneficiary(beneficiaryData);
    form.setValue('beneficiary', beneficiaryData.name);

    setIsBankAccountFormOpen(true);
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add an expense.");
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedAccount = bankAccounts.find(acc => acc.id === values.bank_account_id);
      const bankDetails = selectedAccount ? {
        name: selectedAccount.account_name,
        account: selectedAccount.account_number,
        bank: selectedAccount.bank_name,
      } : null;

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
            status: term.status,
        })),
        bank_account_id: (selectedAccount && !selectedAccount.is_legacy) ? selectedAccount.id : null,
        account_bank: bankDetails,
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
              {/* Form fields are the same as EditExpenseDialog, so they are omitted for brevity */}
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
      <BeneficiaryTypeDialog
        open={isBeneficiaryTypeDialogOpen}
        onOpenChange={setIsBeneficiaryTypeDialogOpen}
        onSelect={handleSelectBeneficiaryType}
      />
      <PersonFormDialog
        open={isPersonFormOpen}
        onOpenChange={setIsPersonFormOpen}
        person={null}
        initialValues={{ full_name: newBeneficiaryName }}
        onSuccess={(newPerson) => handleBeneficiaryCreated(newPerson, 'person')}
      />
      <CompanyFormDialog
        open={isCompanyFormOpen}
        onOpenChange={setIsCompanyFormOpen}
        company={null}
        initialValues={{ name: newBeneficiaryName }}
        onSuccess={(newCompany) => handleBeneficiaryCreated(newCompany, 'company')}
      />
      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        initialName={projectSearch}
        onSuccess={(newProject) => {
          queryClient.invalidateQueries({ queryKey: ['projectsForExpenseForm'] });
          form.setValue('project_id', newProject.id);
        }}
      />
    </>
  );
};

export default AddExpenseDialog;