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
import { CalendarIcon, Loader2, Check, ChevronsUpDown, User, Building, Plus, X, Copy, Briefcase, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, Person, Company, Expense, CustomProperty, BankAccount, User as Profile } from '@/types';
import { CurrencyInput } from '../ui/currency-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '../ui/label';
import BankAccountFormDialog from './BankAccountFormDialog';
import BeneficiaryTypeDialog from './BeneficiaryTypeDialog';
import PersonFormDialog from '../people/PersonFormDialog';
import CompanyFormDialog from '../people/CompanyFormDialog';
import CustomPropertyInput from '../settings/CustomPropertyInput';
import FileUploader, { UploadedFile } from '../ui/FileUploader';
import { useExpenseExtractor } from '@/hooks/useExpenseExtractor';
import { Progress } from '../ui/progress';

const expenseSchema = z.object({
  project_id: z.string().uuid("Project is required."),
  created_by: z.string().uuid().optional(),
  purpose_payment: z.string().optional(),
  beneficiary: z.string().min(1, "Beneficiary is required."),
  tf_amount: z.number().min(1, "Amount must be greater than 0."),
  payment_terms: z.array(z.object({
    amount: z.number().nullable(),
    request_type: z.string().optional(),
    request_date: z.date().optional().nullable(),
    release_date: z.date().optional().nullable(),
    status: z.string().optional(),
  })).optional(),
  bank_account_id: z.string().optional().nullable(),
  remarks: z.string().optional(),
  status_expense: z.string().min(1, "Status is required"),
  custom_properties: z.record(z.any()).optional(),
  attachments_jsonb: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number(),
    type: z.string(),
    storagePath: z.string(),
  })).optional(),
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
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const [isBeneficiaryTypeDialogOpen, setIsBeneficiaryTypeDialogOpen] = useState(false);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  
  // PIC Selection State
  const [projectMembers, setProjectMembers] = useState<Profile[]>([]);
  
  const { extractData, isExtracting } = useExpenseExtractor();

  // Simulate progress when extracting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExtracting) {
      setAnalysisProgress(0);
      interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) return prev; 
          const diff = Math.random() * 10;
          return Math.min(prev + diff, 90);
        });
      }, 300);
    } else {
      setAnalysisProgress(100);
    }
    return () => clearInterval(interval);
  }, [isExtracting]);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectOption[]>({
    queryKey: ['projectsForExpenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0, p_search_term: null, p_exclude_other_personal: false });
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

  const { data: customProperties = [], isLoading: isLoadingProperties } = useQuery<CustomProperty[]>({
    queryKey: ['custom_properties', 'expense'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'expense');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      attachments_jsonb: [], 
    },
  });

  const { control, handleSubmit, watch, setValue, reset } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "payment_terms" });

  const paymentTerms = watch("payment_terms");
  const totalAmount = watch("tf_amount");
  const selectedProjectId = watch("project_id");

  // Fetch full expense details to get `created_by` (PIC) which might not be in the list view
  useEffect(() => {
    const fetchFullExpense = async () => {
      if (expense && open) {
        const { data: fullExpense, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', expense.id)
          .single();
        
        if (fullExpense) {
            // Find beneficiary object
            const foundBeneficiary = beneficiaries.find(b => b.name === fullExpense.beneficiary);
            if (foundBeneficiary) {
                setBeneficiary(foundBeneficiary);
            }
            
            reset({
                project_id: fullExpense.project_id,
                created_by: fullExpense.created_by,
                purpose_payment: fullExpense.purpose_payment || '',
                beneficiary: fullExpense.beneficiary,
                tf_amount: fullExpense.tf_amount,
                status_expense: fullExpense.status_expense,
                remarks: fullExpense.remarks || "",
                payment_terms: (fullExpense.payment_terms as any)?.map((t: any) => ({
                    ...t,
                    request_date: t.request_date ? new Date(t.request_date) : undefined,
                    release_date: t.release_date ? new Date(t.release_date) : undefined,
                })) || [{ amount: null, request_type: 'Requested', request_date: undefined, release_date: undefined, status: 'Pending' }],
                bank_account_id: fullExpense.bank_account_id || null,
                custom_properties: fullExpense.custom_properties || {},
                attachments_jsonb: (fullExpense.attachments_jsonb as any) || [], 
            });
        }
      }
    };
    fetchFullExpense();
  }, [expense, open, beneficiaries, reset]);

  // Fetch project members for PIC selection
  useEffect(() => {
    const fetchMembers = async () => {
        if (!selectedProjectId) {
            setProjectMembers(user ? [user] : []);
            return;
        }
        
        // Find project in the loaded list (which contains member info from RPC)
        const projectData = projects.find(p => p.id === selectedProjectId);
        
        if (projectData && (projectData as any).assignedTo) {
            let members = [...(projectData as any).assignedTo];
            // Include project creator if not in members list
            if ((projectData as any).created_by && !members.find(m => m.id === (projectData as any).created_by.id)) {
                members.push({ ...(projectData as any).created_by, role: 'owner' });
            }
            setProjectMembers(members);
        } else {
             setProjectMembers(user ? [user] : []);
        }
    };
    fetchMembers();
  }, [selectedProjectId, projects, user]);

  const balance = useMemo(() => {
    const totalAllocated = (paymentTerms || []).reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
    return (totalAmount || 0) - totalAllocated;
  }, [totalAmount, paymentTerms]);

  const paidAmount = useMemo(() => {
    return (paymentTerms || [])
      .filter(term => term.status === 'Paid')
      .reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
  }, [paymentTerms]);

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
        const currentBankId = form.getValues('bank_account_id');
        if (!currentBankId || !currentBankId.startsWith('temp-')) {
            setBankAccounts([]);
        }
      }
    };
    fetchBankAccounts();
  }, [beneficiary]);

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

  const handleFileProcessed = async (file: UploadedFile) => {
    let finalUrl = file.url;
    
    // Check if it's a blob URL
    if (file.url.startsWith('blob:')) {
      try {
        toast.info("Uploading image for analysis...");
        
        // 1. Fetch the blob data
        const response = await fetch(file.url);
        const blob = await response.blob();
        const fileObj = new File([blob], file.name, { type: file.type });

        // 2. Upload to Supabase
        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `temp-analysis/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('expense')
          .upload(filePath, fileObj);

        if (uploadError) throw uploadError;

        // 3. Get Public URL
        const { data: urlData } = supabase.storage
          .from('expense')
          .getPublicUrl(filePath);
          
        finalUrl = urlData.publicUrl;
      } catch (error) {
        console.error("Pre-analysis upload failed:", error);
        toast.error("Failed to upload image for analysis.");
        return;
      }
    }
    
    const extractedData = await extractData({ url: finalUrl, type: file.type });
    
    if (extractedData) {
      if (extractedData.amount && extractedData.amount > 0) {
        setValue('tf_amount', extractedData.amount, { shouldValidate: true });
        
        const terms = form.getValues('payment_terms');
        if (terms && terms.length === 1 && !terms[0].amount) {
            setValue('payment_terms.0.amount', extractedData.amount);
        }
      }
      
      if (extractedData.purpose) {
        setValue('purpose_payment', extractedData.purpose, { shouldValidate: true });
      }

      let currentBeneficiary = beneficiary;

      if (extractedData.beneficiary && !watch('beneficiary')) {
        const matchedBeneficiary = beneficiaries.find(b => 
          b.name.toLowerCase() === extractedData.beneficiary?.toLowerCase() ||
          b.name.toLowerCase().includes(extractedData.beneficiary?.toLowerCase() || '') ||
          (extractedData.beneficiary && b.name.toLowerCase().includes(extractedData.beneficiary.toLowerCase()))
        );
        if (matchedBeneficiary) {
          currentBeneficiary = matchedBeneficiary;
          setBeneficiary(matchedBeneficiary);
          setValue('beneficiary', matchedBeneficiary.name, { shouldValidate: true });
        } else {
          setValue('beneficiary', extractedData.beneficiary, { shouldValidate: true });
        }
      }

      // Handle Bank Details
      if (extractedData.bank_details && extractedData.bank_details.account_number) {
        const extractedBank = extractedData.bank_details;
        
        if (currentBeneficiary) {
          try {
            const { data: existingAccounts } = await supabase.from('bank_accounts')
              .select('*')
              .eq('owner_id', currentBeneficiary.id)
              .eq('account_number', extractedBank.account_number)
              .maybeSingle();

            if (existingAccounts) {
              setBankAccounts(prev => {
                const exists = prev.find(p => p.id === existingAccounts.id);
                return exists ? prev : [...prev, existingAccounts as unknown as BankAccount];
              });
              setValue('bank_account_id', existingAccounts.id);
              toast.info(`Selected existing bank account: ${extractedBank.bank_name}`);
            } else {
              const { data: newAccount, error: createError } = await supabase.from('bank_accounts').insert({
                owner_id: currentBeneficiary.id,
                owner_type: currentBeneficiary.type,
                bank_name: extractedBank.bank_name || 'Unknown Bank',
                account_number: extractedBank.account_number,
                account_name: extractedBank.account_name || currentBeneficiary.name,
                swift_code: extractedBank.swift_code || null,
                created_by: user?.id
              }).select().single();

              if (createError) throw createError;

              if (newAccount) {
                setBankAccounts(prev => [...prev, newAccount as unknown as BankAccount]);
                setValue('bank_account_id', newAccount.id);
                toast.success(`Created and selected new bank account: ${extractedBank.bank_name}`);
              }
            }
          } catch (err) {
            console.error('Error auto-creating bank account:', err);
          }
        } else {
          const tempId = `temp-${Date.now()}`;
          const tempAccount: BankAccount = {
            id: tempId,
            account_name: extractedBank.account_name || extractedData.beneficiary || 'Unknown Name',
            account_number: extractedBank.account_number,
            bank_name: extractedBank.bank_name || 'Unknown Bank',
            swift_code: extractedBank.swift_code || null,
            is_legacy: true, 
            owner_id: 'temp',
            owner_type: 'person'
          };
          
          setBankAccounts([tempAccount]);
          setValue('bank_account_id', tempId);
          toast.info(`Set temporary bank details: ${extractedBank.bank_name}`);
        }
      }

      if (extractedData.remarks) {
        const currentRemarks = watch('remarks') || '';
        const newRemarks = currentRemarks ? `${currentRemarks}\n\n--- AI Extracted Notes ---\n${extractedData.remarks}` : extractedData.remarks;
        setValue('remarks', newRemarks, { shouldValidate: true });
      }
      
      toast.success("Data extracted from document!");
    }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!expense) return;
    setIsSubmitting(true);
    try {
      const selectedAccount = bankAccounts.find(acc => acc.id === values.bank_account_id);
      const isTempAccount = selectedAccount && (selectedAccount.id.startsWith('temp-') || selectedAccount.is_legacy);

      let bankDetails = null;
      if (selectedAccount) {
        bankDetails = { 
          name: selectedAccount.account_name, 
          account: selectedAccount.account_number, 
          bank: selectedAccount.bank_name,
          swift_code: selectedAccount.swift_code 
        };
      } else if (values.bank_account_id && expense?.account_bank) {
        bankDetails = expense.account_bank;
      }

      const { error } = await supabase.from('expenses').update({
        project_id: values.project_id,
        created_by: values.created_by, // Update PIC
        purpose_payment: values.purpose_payment,
        beneficiary: values.beneficiary,
        tf_amount: values.tf_amount,
        payment_terms: values.payment_terms?.map(term => ({
            ...term,
            request_date: term.request_date ? term.request_date.toISOString() : null,
            release_date: term.release_date ? term.release_date.toISOString() : null,
        })),
        bank_account_id: (selectedAccount && !isTempAccount) ? selectedAccount.id : null,
        account_bank: bankDetails,
        remarks: values.remarks,
        status_expense: values.status_expense,
        custom_properties: values.custom_properties,
        attachments_jsonb: values.attachments_jsonb, 
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

  const isFormDisabled = isSubmitting || isExtracting;

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
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={isLoadingProjects || isFormDisabled}>
                            {field.value ? projects.find((project) => project.id === field.value)?.name : "Select a project"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
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

              {/* PIC Selector */}
              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC (Person In Charge)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isFormDisabled || projectMembers.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PIC" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectMembers.length > 0 ? (
                           projectMembers.map(member => (
                              <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                           ))
                        ) : (
                           user && <SelectItem value={user.id}>{user.name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose Payment</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter purpose of payment" {...field} value={field.value || ''} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attachments_jsonb"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Attachments
                      </FormLabel>
                      {isExtracting && <span className="text-xs text-primary animate-pulse flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Analyzing... {Math.round(analysisProgress)}%</span>}
                    </div>
                    {isExtracting && (
                      <div className="space-y-1 mb-2">
                        <Progress value={analysisProgress} className="h-1.5" />
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mb-1">
                        Upload invoice or receipt to auto-fill details (Images or PDF)
                    </div>
                    <FormControl>
                      <FileUploader
                        bucket="expense"
                        value={field.value || []}
                        onChange={field.onChange}
                        maxFiles={5}
                        maxSize={20971520} // 20MB
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] }}
                        disabled={isFormDisabled}
                        onFileProcessed={handleFileProcessed}
                      />
                    </FormControl>
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
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={isLoadingBeneficiaries || isFormDisabled}>
                          {field.value || "Select a beneficiary"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search beneficiary..." value={beneficiarySearch} onValueChange={setBeneficiarySearch} />
                        <CommandList>
                          <CommandEmpty>
                            <Button variant="ghost" className="w-full justify-start" onClick={() => handleCreateNewBeneficiary(beneficiarySearch)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create "{beneficiarySearch}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
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
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsBankAccountFormOpen(true)} disabled={!beneficiary || isFormDisabled}>
                      <Plus className="mr-2 h-4 w-4" /> Add New
                    </Button>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      {isLoadingBankAccounts ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading accounts...</span></div>
                      ) : bankAccounts.length > 0 ? (
                        bankAccounts.map(account => (
                          <div key={account.id} onClick={() => field.onChange(account.id)} className={cn("border rounded-lg p-3 cursor-pointer transition-all", field.value === account.id ? "border-primary ring-2 ring-primary ring-offset-2" : "hover:border-primary/50")} role="button" tabIndex={0}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-grow">
                                <p className="font-semibold">{account.bank_name}</p>
                                <p className="text-muted-foreground">{account.account_number}</p>
                                <div className="text-sm text-muted-foreground flex gap-2">
                                    <span>{account.account_name}</span>
                                    {account.swift_code && <span>• SWIFT: {account.swift_code}</span>}
                                </div>
                              </div>
                              <div className="flex items-center shrink-0">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${account.bank_name}\n${account.account_number}\n${account.account_name}${account.swift_code ? `\nSWIFT: ${account.swift_code}` : ''}`); toast.success("Bank details copied!"); }}><Copy className="h-4 w-4" /></Button>
                                {field.value === account.id && <Check className="h-4 w-4 text-primary ml-1" />}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                            {beneficiary ? "No bank accounts found." : "Select a beneficiary or upload an invoice."}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tf_amount" render={({ field }) => (
                <FormItem><FormLabel>Total Amount</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>
              )} />
              <div>
                <FormLabel>Payment Terms</FormLabel>
                <div className="space-y-3 mt-2">
                  {fields.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">Term {index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1 || isFormDisabled} className="h-7 w-7"><X className="h-4 w-4" /></Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField control={form.control} name={`payment_terms.${index}.amount`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Amount</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} placeholder="Amount" disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`payment_terms.${index}.request_date`} render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Requested Date (Auto-filled)</FormLabel><div className="flex gap-1">
                            <FormField control={form.control} name={`payment_terms.${index}.request_type`} render={({ field: typeField }) => (
                              <FormItem><Select onValueChange={typeField.onChange} defaultValue={typeField.value} disabled={isFormDisabled}><FormControl><SelectTrigger className="w-[110px] bg-background"><SelectValue placeholder="Type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Requested">Requested</SelectItem><SelectItem value="Due">Due</SelectItem></SelectContent></Select></FormItem>
                            )} />
                            <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("flex-1 w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")} disabled={isFormDisabled}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                          </div><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name={`payment_terms.${index}.release_date`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Payment Schedule (Due Date)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")} disabled={isFormDisabled}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`payment_terms.${index}.status`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled}><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ amount: null, request_type: 'Requested', request_date: new Date(), release_date: undefined, status: 'Pending' })} disabled={isFormDisabled}>
                    <Plus className="mr-2 h-4 w-4" /> Add Term
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Balance (Rp)</Label>
                <Input value={balance.toLocaleString('id-ID')} className={cn("col-span-3 bg-muted", balance !== 0 && "text-red-500 font-semibold")} readOnly />
              </div>
              <FormField control={form.control} name="remarks" render={({ field }) => (
                <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>
              )} />
              {isLoadingProperties ? (
                <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : customProperties.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  {customProperties.map(prop => (
                    <FormField
                      key={prop.id}
                      control={form.control}
                      name={`custom_properties.${prop.name}`}
                      render={({ field }) => (
                        <FormItem>
                          <CustomPropertyInput
                            property={prop}
                            control={form.control}
                            name={`custom_properties.${prop.name}`}
                            bucket="expense"
                            disabled={isFormDisabled}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
            </form>
          </Form>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isFormDisabled}>Cancel</Button>
            <Button type="submit" form="expense-form" disabled={isFormDisabled}>
              {(isSubmitting || isExtracting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExtracting ? 'Analyzing Document...' : 'Save Changes'}
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
          onSuccess={() => {
            const fetchNewAccounts = async () => {
              const { data, error } = await supabase.rpc('get_beneficiary_bank_accounts', {
                p_owner_id: beneficiary!.id,
                p_owner_type: beneficiary!.type,
              });
              if (data) {
                setBankAccounts(data);
                const newAccount = data[data.length - 1];
                if (newAccount) {
                  setValue('bank_account_id', newAccount.id);
                }
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