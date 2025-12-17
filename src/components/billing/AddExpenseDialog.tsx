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
import { CalendarIcon, Loader2, Check, ChevronsUpDown, User, Building, Plus, X, Copy, FileText, Wand2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, Person, Company, CustomProperty, BankAccount, User as Profile } from '@/types';
import { CurrencyInput } from '../ui/currency-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '../ui/label';
import BankAccountFormDialog from './BankAccountFormDialog';
import BeneficiaryTypeDialog from './BeneficiaryTypeDialog';
import PersonFormDialog from '../people/PersonFormDialog';
import CompanyFormDialog from '../people/CompanyFormDialog';
import CreateProjectDialog from '../projects/CreateProjectDialog';
import CustomPropertyInput from '../settings/CustomPropertyInput';
import FileUploader, { UploadedFile } from '../ui/FileUploader';
import { useExpenseExtractor } from '@/hooks/useExpenseExtractor';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const expenseSchema = z.object({
  project_id: z.string().uuid("Please select a project."),
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
  ai_review_notes: z.string().optional(),
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

interface ProjectOption extends Project {
    client_name?: string | null;
    client_company_name?: string | null;
}

// Helper function to extract date ranges from project names
const extractDateFromProjectName = (name: string): { start: Date, end: Date } | null => {
  // 1. Range: dd-ddmmyy (e.g. 05-071225 -> 5 Dec 2025 to 7 Dec 2025)
  const rangeMatch = name.match(/\b(\d{2})-(\d{2})(\d{2})(\d{2})\b/);
  if (rangeMatch) {
    const startDay = parseInt(rangeMatch[1]);
    const endDay = parseInt(rangeMatch[2]);
    const month = parseInt(rangeMatch[3]) - 1; 
    const year = 2000 + parseInt(rangeMatch[4]);
    if (month >= 0 && month <= 11) {
      const start = new Date(year, month, startDay);
      const end = new Date(year, month, endDay);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) return { start, end };
    }
  }
  // 2. Full Date: ddmmyy
  const fullDateMatch = name.match(/\b(\d{2})(\d{2})(\d{2})\b/);
  if (fullDateMatch) {
    const day = parseInt(fullDateMatch[1]);
    const month = parseInt(fullDateMatch[2]) - 1;
    const year = 2000 + parseInt(fullDateMatch[3]);
    if (month >= 0 && month <= 11) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return { start: date, end: date };
    }
  }
  // 3. Month Year: mmyy
  const monthYearMatch = name.match(/\b(\d{2})(\d{2})\b/);
  if (monthYearMatch) {
    const month = parseInt(monthYearMatch[1]) - 1;
    const year = 2000 + parseInt(monthYearMatch[2]);
    if (month >= 0 && month <= 11) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0); 
      if (!isNaN(start.getTime())) return { start, end };
    }
  }
  return null;
};

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
  
  const [projectMembers, setProjectMembers] = useState<Profile[]>([]);
  
  const { extractData, isExtracting } = useExpenseExtractor();
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);

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

  const processingFiles = useMemo(() => {
    if (!currentProcessingFile || !isExtracting) return undefined;
    return {
      [currentProcessingFile]: {
        progress: analysisProgress,
        label: 'Analyzing...'
      }
    };
  }, [currentProcessingFile, isExtracting, analysisProgress]);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectOption[]>({
    queryKey: ['projectsForExpenseForm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_dashboard_projects_v2', { 
            p_limit: 1000,
            p_offset: 0,
            p_search_term: null,
            p_exclude_other_personal: false,
            p_year: null,
            p_timeframe: null,
            p_sort_direction: 'desc'
        });
      
      if (error) throw error;
      return data || [];
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
      project_id: '',
      created_by: user?.id,
      beneficiary: '',
      tf_amount: 0,
      payment_terms: [{ amount: null, request_type: 'Requested', request_date: new Date(), release_date: undefined, status: 'Pending' }],
      bank_account_id: null,
      remarks: '',
      ai_review_notes: '',
      custom_properties: {},
      attachments_jsonb: [], 
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "payment_terms",
  });

  const paymentTerms = watch("payment_terms");
  const totalAmount = watch("tf_amount");
  const selectedProjectId = watch("project_id");

  useEffect(() => {
    const fetchMembers = async () => {
        if (!selectedProjectId) {
            setProjectMembers(user ? [user] : []);
            return;
        }
        const project = projects.find(p => p.id === selectedProjectId);
        if (project && project.assignedTo) {
            let members = [...project.assignedTo];
            if (project.created_by && !members.find(m => m.id === project.created_by.id)) {
                members.push({ ...project.created_by, role: 'owner' } as any);
            }
            setProjectMembers(members);
        } else {
             setProjectMembers(user ? [user] : []);
        }
    };
    fetchMembers();
  }, [selectedProjectId, projects, user]);

  const balance = useMemo(() => {
    const totalPaid = (paymentTerms || []).reduce((sum, term) => sum + (Number(term.amount) || 0), 0);
    return (totalAmount || 0) - totalPaid;
  }, [totalAmount, paymentTerms]);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (beneficiary) {
        setIsLoadingBankAccounts(true);
        const { data, error } = await supabase.rpc('get_beneficiary_bank_accounts', {
            p_owner_id: beneficiary.id,
            p_owner_type: beneficiary.type,
        });
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
            setValue('bank_account_id', null);
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

  const findMatchingProject = (extracted: any) => {
      let bestMatch: ProjectOption | null = null;
      let maxScore = 0;
      const normalize = (s: string) => s?.toLowerCase().trim() || '';

      projects.forEach(p => {
          let score = 0;
          const pName = normalize(p.name);
          const cName = normalize(p.client_name || '');
          const cComp = normalize(p.client_company_name || '');
          const pVenue = normalize(p.venue || '');
          
          const exBeneficiary = normalize(extracted.beneficiary); 
          const exAddress = normalize(extracted.address || ''); 
          const exVenue = normalize(extracted.venue || '');
          const exDate = extracted.date ? parseISO(extracted.date) : null;
          
          if (exBeneficiary) {
              if (cComp && (cComp.includes(exBeneficiary) || exBeneficiary.includes(cComp))) score += 10;
              else if (cName && (cName.includes(exBeneficiary) || exBeneficiary.includes(cName))) score += 5;
              if (pName.includes(exBeneficiary)) score += 3;
          }

          const checkVenue = exVenue || exAddress;
          if (pVenue && checkVenue) {
             if (pVenue.includes(checkVenue) || checkVenue.includes(pVenue)) score += 8;
          }

          if (exDate && !isNaN(exDate.getTime()) && p.start_date) {
              const start = new Date(p.start_date);
              const end = p.due_date ? new Date(p.due_date) : new Date(start);
              const bufferStart = new Date(start); bufferStart.setDate(start.getDate() - 7);
              const bufferEnd = new Date(end); bufferEnd.setDate(end.getDate() + 60);
              if (isWithinInterval(exDate, { start: bufferStart, end: bufferEnd })) score += 5;
          }

          // Check against date in project name
          const nameDate = extractDateFromProjectName(p.name);
          if (nameDate && exDate && !isNaN(exDate.getTime())) {
              const bufferStart = new Date(nameDate.start); 
              bufferStart.setDate(bufferStart.getDate() - 7);
              const bufferEnd = new Date(nameDate.end); 
              bufferEnd.setDate(bufferEnd.getDate() + 60);
              if (isWithinInterval(exDate, { start: bufferStart, end: bufferEnd })) score += 10;
          }

          if (score > maxScore) {
              maxScore = score;
              bestMatch = p;
          }
      });
      return maxScore > 0 ? bestMatch : null;
  };

  const applyExtractedData = async (extractedData: any) => {
    if (extractedData.amount && extractedData.amount > 0) {
      setValue('tf_amount', extractedData.amount, { shouldValidate: true });
      
      const terms = form.getValues('payment_terms');
      const invoiceDate = extractedData.date ? new Date(extractedData.date) : new Date();
      const dueDate = extractedData.due_date ? new Date(extractedData.due_date) : invoiceDate;

      if (terms && terms.length === 1) {
           setValue('payment_terms.0.amount', extractedData.amount);
           setValue('payment_terms.0.request_date', new Date());
           setValue('payment_terms.0.release_date', dueDate);
           setValue('payment_terms.0.status', 'Pending');
      } else {
           setValue('payment_terms', [{
               amount: extractedData.amount,
               request_type: 'Requested',
               request_date: new Date(),
               release_date: dueDate,
               status: 'Pending'
           }]);
      }
    }
    
    const explicitDescription = extractedData.description || extractedData.purpose;
    const itemsDescription = Array.isArray(extractedData.items) && extractedData.items.length > 0 
        ? extractedData.items.map((i: any) => i.description || i.name).filter(Boolean).join(', ') 
        : null;
    const purpose = itemsDescription || explicitDescription || extractedData.summary;

    if (purpose) {
      setValue('purpose_payment', purpose, { shouldValidate: true });
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

    if (!watch('project_id')) {
        const matchedProject = findMatchingProject(extractedData);
        if (matchedProject) {
            setValue('project_id', matchedProject.id);
            toast.success(`Matched to project: ${matchedProject.name}`);
        }
    }

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
              toast.success(`Automatically added and selected new bank account: ${extractedBank.bank_name} ${extractedBank.swift_code ? `(${extractedBank.swift_code})` : ''}`);
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
  };

  // Handle Files & AI
  const handleFileProcessed = async (file: UploadedFile) => {
    let finalUrl = file.url;
    
    // Check if it's a blob URL (new file)
    if (file.url.startsWith('blob:')) {
      try {
        toast.info("Uploading image for analysis...");
        const response = await fetch(file.url);
        const blob = await response.blob();
        const fileObj = new File([blob], file.name, { type: file.type });

        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `temp-analysis/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage.from('expense').upload(filePath, fileObj);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('expense').getPublicUrl(filePath);
        finalUrl = urlData.publicUrl;
      } catch (error) {
        console.error("Pre-analysis upload failed:", error);
        toast.error("Failed to upload image for analysis.");
        return;
      }
    }
    
    setCurrentProcessingFile(file.name);
    const extractedData = await extractData({ url: finalUrl, type: file.type });
    
    if (extractedData) {
      await applyExtractedData(extractedData);
    }
    
    setCurrentProcessingFile(null);
  };

  const handleRunAiCheck = async () => {
    const attachments = form.getValues('attachments_jsonb');
    const instructions = form.getValues('ai_review_notes');
    
    if (!attachments || attachments.length === 0) {
       toast.error("No attachments found to analyze.");
       return;
    }
    
    const file = attachments[attachments.length - 1]; // Use last file
    setCurrentProcessingFile(file.name);
    
    try {
        const extractedData = await extractData({ 
            url: file.url, 
            type: file.type, 
            instructions: instructions 
        });
        
        if (extractedData) {
            await applyExtractedData(extractedData);
        }
    } finally {
        setCurrentProcessingFile(null);
    }
  };

  // Handle File List Changes (Sync with Form)
  const handleFilesChange = (files: any[]) => {
      setValue('attachments_jsonb', files as any, { shouldDirty: true });
      
      // Auto-process the last added file if it's new
      const newFiles = files.filter(f => f.originalFile instanceof File);
      if (newFiles.length > 0) {
          handleFileProcessed(newFiles[newFiles.length - 1]);
      }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Handle File Uploads
      const currentFiles = values.attachments_jsonb || [];
      const filesToUpload = currentFiles.filter((f: any) => f.originalFile instanceof File);
      const finalAttachments = currentFiles.filter((f: any) => !(f.originalFile instanceof File)); // Keep existing files

      // Upload new files
      for (const fileItem of filesToUpload) {
          const file = (fileItem as any).originalFile as File;
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `expense-attachments/${values.project_id}/${Date.now()}-${sanitizedFileName}`;
          
          const { error: uploadError } = await supabase.storage.from('expense').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          
          const { data: urlData } = supabase.storage.from('expense').getPublicUrl(filePath);
          
          finalAttachments.push({
              name: file.name,
              url: urlData.publicUrl,
              size: file.size,
              type: file.type,
              storagePath: filePath
          });
      }

      // 2. Prepare Data
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
      }

      // 3. Insert DB
      const { error } = await supabase.from('expenses').insert({
        project_id: values.project_id,
        created_by: values.created_by,
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
        custom_properties: {
            ...values.custom_properties,
            ai_review_notes: values.ai_review_notes
        },
        attachments_jsonb: finalAttachments, 
      });

      if (error) throw error;
      toast.success("Expense added successfully.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to add expense.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isExtracting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a new expense for a project.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Project</FormLabel>
                    <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={isFormDisabled}>
                            {field.value ? projects.find((project) => project.id === field.value)?.name : "Select a project"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search project..." value={projectSearch} onValueChange={setProjectSearch} />
                          {isLoadingProjects ? (
                            <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading projects...</div>
                          ) : (
                            <CommandList>
                              <CommandEmpty>
                                <Button variant="ghost" className="w-full justify-start" onClick={() => { setIsCreateProjectDialogOpen(true); setProjectPopoverOpen(false); }}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create "{projectSearch}"
                                </Button>
                              </CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {projects.map((project) => (
                                  <CommandItem 
                                    value={`${project.name} ${project.id}`}
                                    key={project.id} 
                                    onSelect={() => { 
                                      form.setValue("project_id", project.id); 
                                      setProjectPopoverOpen(false); 
                                      setProjectSearch(''); 
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", project.id === field.value ? "opacity-100" : "opacity-0")} />
                                    <div className="flex flex-col">
                                        <span>{project.name}</span>
                                        {(project.client_company_name || project.client_name) && (
                                          <span className="text-xs text-muted-foreground">
                                            {project.client_company_name || project.client_name}
                                          </span>
                                        )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          )}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || user?.id} disabled={isFormDisabled || projectMembers.length === 0}>
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
                    <div className="flex justify-between items-center">
                      <FormLabel>Purpose Payment</FormLabel>
                      {/* Removed Auto-fill with AI button */}
                    </div>
                    <FormControl>
                      <Input placeholder="Enter purpose of payment" {...field} value={field.value || ''} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ai_review_notes"
                render={({ field }) => (
                  <FormItem>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start h-auto p-0 text-base font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-100 disabled:cursor-default"
                        disabled={isExtracting || !watch('attachments_jsonb')?.length}
                        onClick={handleRunAiCheck}
                    >
                        <Wand2 className="h-4 w-4 text-purple-500 mr-2" />
                        AI Review Instructions 
                        {isExtracting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {!isExtracting && watch('attachments_jsonb')?.length > 0 && <Sparkles className="ml-2 h-4 w-4" />}
                    </Button>
                    <FormControl>
                      <Textarea 
                        placeholder="Instruct AI to check for missing details or documents (e.g. 'Check if invoice number is missing', 'Verify tax calculation')" 
                        {...field} 
                        value={field.value || ''}
                        disabled={isFormDisabled} 
                        className="bg-purple-50/50 border-purple-100 focus-visible:ring-purple-200"
                      />
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
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                        Upload invoice or receipt to auto-fill details (Image & PDF supported)
                    </div>
                    <FormControl>
                      <FileUploader
                        bucket="expense"
                        value={field.value || []}
                        onChange={(files) => handleFilesChange(files)}
                        maxFiles={5}
                        maxSize={20971520} // 20MB
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] }}
                        disabled={isFormDisabled}
                        onFileProcessed={handleFileProcessed}
                        processingFiles={processingFiles}
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
              <FormField
                control={form.control}
                name="status_expense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Pending', 'Reviewed', 'Approved', 'Paid', 'Rejected'].map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          <FormItem><FormLabel className="text-xs">Requested Date</FormLabel><div className="flex gap-1">
                            <FormField control={form.control} name={`payment_terms.${index}.request_type`} render={({ field: typeField }) => (
                              <FormItem><Select onValueChange={typeField.onChange} defaultValue={typeField.value} disabled={isFormDisabled}><FormControl><SelectTrigger className="w-[110px] bg-background"><SelectValue placeholder="Type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Requested">Requested</SelectItem><SelectItem value="Due">Due</SelectItem></SelectContent></Select></FormItem>
                            )} />
                            <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("flex-1 w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")} disabled={isFormDisabled}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                          </div><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name={`payment_terms.${index}.release_date`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Payment Schedule</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")} disabled={isFormDisabled}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
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
              {isExtracting ? 'Analyzing...' : 'Add Expense'}
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
      <PersonFormDialog open={isPersonFormOpen} onOpenChange={setIsPersonFormOpen} person={null} initialValues={{ first_name: newBeneficiaryName.split(' ')[0], last_name: newBeneficiaryName.split(' ').slice(1).join(' ') }} onSuccess={(newPerson) => handleBeneficiaryCreated(newPerson, 'person')} />
      <CompanyFormDialog open={isCompanyFormOpen} onOpenChange={setIsCompanyFormOpen} company={null} initialValues={{ name: newBeneficiaryName }} onSuccess={(newCompany) => handleBeneficiaryCreated(newCompany, 'company')} />
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