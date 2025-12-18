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
import { CalendarIcon, Loader2, Check, ChevronsUpDown, User, Building, Plus, X, Copy, FileText, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, Person, Company, CustomProperty, BankAccount, User as Profile, Expense } from '@/types';
import { CurrencyInput } from '../ui/currency-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '../ui/label';
import BankAccountFormDialog from './BankAccountFormDialog';
import BeneficiaryTypeDialog from './BeneficiaryTypeDialog';
import PersonFormDialog from '../people/PersonFormDialog';
import CompanyFormDialog from '../people/CompanyFormDialog';
import CreateProjectDialog from '../projects/CreateProjectDialog';
import CustomPropertyInput from '../settings/CustomPropertyInput';
import FileUploader, { FileMetadata } from '../ui/FileUploader';
import { useExpenseExtractor } from '@/hooks/useExpenseExtractor';
import { convertPdfToImage } from '@/lib/pdfUtils';

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

const paymentTermSchema = z.object({
    amount: z.number().nullable(),
    request_type: z.string().optional(),
    request_date: z.date().optional().nullable(),
    release_date: z.date().optional().nullable(),
    status: z.string().optional(),
    status_remarks: z.string().optional().nullable(),
    pic_feedback: z.string().optional(),
});

const expenseSchema = z.object({
  project_id: z.string().uuid("Please select a project."),
  created_by: z.string().uuid().optional(),
  purpose_payment: z.string().optional(),
  beneficiary: z.string().min(1, "Beneficiary is required."),
  tf_amount: z.number().min(1, "Amount must be greater than 0."),
  payment_terms: z.array(paymentTermSchema).optional(),
  bank_account_id: z.string().optional().nullable(),
  remarks: z.string().optional(),
  ai_review_notes: z.string().optional(),
  custom_properties: z.record(z.any()).optional(),
  attachments_jsonb: z.array(z.any()).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ProjectOption extends Project {
    client_name?: string | null;
    client_company_name?: string | null;
}

const EditExpenseDialog = ({ open, onOpenChange, expense: propExpense }: EditExpenseDialogProps) => {
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
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [detectedBeneficiaryType, setDetectedBeneficiaryType] = useState<'person' | 'company' | null>(null);

  const canManageBankAccounts = useMemo(() => {
    if (!user?.role) return false;
    const role = user.role.toLowerCase();
    return role === 'master admin' || role === 'finance';
  }, [user?.role]);

  // Fetch full expense details if needed
  const { data: expense } = useQuery({
    queryKey: ['expense_edit', propExpense?.id],
    queryFn: async () => {
      if (!propExpense?.id) return null;
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', propExpense.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!propExpense?.id && open,
    initialData: propExpense as any
  });

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
      payment_terms: [{ amount: null, request_type: 'Requested', request_date: new Date(), release_date: undefined, status: 'Requested', status_remarks: null }],
      bank_account_id: null,
      remarks: '',
      ai_review_notes: '',
      custom_properties: {},
      attachments_jsonb: [], 
    },
  });

  const { control, handleSubmit, watch, setValue, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "payment_terms",
  });

  const paymentTerms = watch("payment_terms");
  const totalAmount = watch("tf_amount");
  const selectedProjectId = watch("project_id");

  useEffect(() => {
    if (expense && open) {
        const parsedTerms = Array.isArray(expense.payment_terms) 
            ? expense.payment_terms.map((term: any) => ({
                ...term,
                request_date: term.request_date ? new Date(term.request_date) : null,
                release_date: term.release_date ? new Date(term.release_date) : null,
                amount: Number(term.amount) || null,
                status_remarks: term.status_remarks || null,
            }))
            : [{ amount: null, request_type: 'Requested', request_date: new Date(), status: 'Requested', status_remarks: null }];

        if (expense.beneficiary) {
            const matched = beneficiaries.find(b => b.name === expense.beneficiary);
            if (matched) {
                setBeneficiary(matched);
            } else {
                setBeneficiary({ id: 'unknown', name: expense.beneficiary, type: 'person' }); 
            }
        }

        reset({
            project_id: expense.project_id,
            created_by: expense.created_by,
            purpose_payment: (expense as any).purpose_payment || '',
            beneficiary: expense.beneficiary,
            tf_amount: Number(expense.tf_amount),
            payment_terms: parsedTerms,
            bank_account_id: expense.bank_account_id || null,
            remarks: expense.remarks || '',
            ai_review_notes: (expense.custom_properties as any)?.ai_review_notes || '',
            custom_properties: expense.custom_properties || {},
            attachments_jsonb: (expense as any).attachments_jsonb || [],
        });
    }
  }, [expense, open, beneficiaries, reset]);

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
      if (beneficiary && beneficiary.id !== 'unknown' && beneficiary.id !== 'new') {
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
      } else if (beneficiary) {
          // Keep existing bank account info if beneficiary is just text/unknown ID
      } else {
        const currentBankId = form.getValues('bank_account_id');
        if (!currentBankId || !currentBankId.startsWith('temp-')) {
            if (!expense || !expense.bank_account_id) {
                 setBankAccounts([]);
            }
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
          const exDate = extracted.date ? new Date(extracted.date) : null;
          
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
           setValue('payment_terms.0.release_date', dueDate);
      } else {
           setValue('payment_terms', [{
               amount: extractedData.amount,
               request_type: 'Requested',
               request_date: new Date(),
               release_date: dueDate,
               status: 'Requested'
           }]);
      }
    }
    
    const description = extractedData.description || extractedData.purpose || extractedData.summary;
    if (description) {
      setValue('purpose_payment', description, { shouldValidate: true });
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
        // Set detected type if available, default to company if undefined
        const type = extractedData.beneficiary_type?.toLowerCase() === 'person' ? 'person' : 'company';
        setBeneficiary({ id: 'new', name: extractedData.beneficiary, type });
        setDetectedBeneficiaryType(type);
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
      
      if (currentBeneficiary && currentBeneficiary.id !== 'new') {
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
              toast.success(`Automatically added and selected new bank account: ${extractedBank.bank_name}`);
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

  const handleFileProcessed = async (file: File) => {
    let finalUrl = URL.createObjectURL(file);
    setCurrentProcessingFile(file.name);
    
    try {
        let fileToProcess = file;

        // Convert PDF to Image if necessary for AI analysis
        // Using relaxed check for 'pdf' string in type
        if (file.type.includes('pdf')) {
            toast.info("Converting PDF to image for analysis...");
            const imageFile = await convertPdfToImage(file);
            if (imageFile) {
                fileToProcess = imageFile;
                finalUrl = URL.createObjectURL(imageFile);
                toast.success("PDF successfully converted to image for analysis");
            } else {
                toast.error("Could not convert PDF to image. AI analysis skipped.");
                // We stop here for analysis, but the file is still uploaded below in onSubmit if saved
                return;
            }
        }

        const sanitizedFileName = fileToProcess.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `temp-analysis/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage.from('expense').upload(filePath, fileToProcess);
        
        if (uploadError) {
             console.error("Upload for analysis failed", uploadError);
             return;
        }

        const { data: urlData } = supabase.storage.from('expense').getPublicUrl(filePath);
        finalUrl = urlData.publicUrl;

        // Pass instructions to the extractor with specific request for type detection
        const instructions = (form.getValues('ai_review_notes') || '') + "\nIdentify if the beneficiary is a 'person' or 'company' and return it as 'beneficiary_type'.";

        const extractedData = await extractData({ 
            url: finalUrl, 
            type: fileToProcess.type,
            instructions: instructions
        });
        
        if (extractedData) {
            await applyExtractedData(extractedData);
        }
    } catch (e) {
        console.error("Processing failed", e);
    } finally {
        setCurrentProcessingFile(null);
    }
  };

  const handleRunAiCheck = async () => {
    const attachments = form.getValues('attachments_jsonb');
    
    if (!attachments || attachments.length === 0) {
       toast.error("No attachments found to analyze.");
       return;
    }
    
    // Find first NEW file if possible, else take last file
    const lastFile = [...attachments].reverse().find(f => f instanceof File) as File | undefined;

    if (!lastFile) {
        toast.error("Please upload a new file to analyze.");
        return;
    }
    
    handleFileProcessed(lastFile);
  };

  const handleFilesChange = (files: (File | FileMetadata)[]) => {
      setValue('attachments_jsonb', files, { shouldDirty: true });
      const newFiles = files.filter((f): f is File => f instanceof File);
      if (newFiles.length > 0) {
          handleFileProcessed(newFiles[newFiles.length - 1]);
      }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      // Check if beneficiary is new and needs creation
      const existingBeneficiary = beneficiaries.find(b => b.name === values.beneficiary);
      // Determine type: existing type, detected type from AI, or default to company
      const finalBeneficiaryType = existingBeneficiary?.type || detectedBeneficiaryType || 'company';

      if (!existingBeneficiary && values.beneficiary) {
          try {
              if (finalBeneficiaryType === 'person') {
                  const { error } = await supabase.from('people').insert({ full_name: values.beneficiary }).select().single();
                  if (error) throw error;
                  toast.success(`Created new person: ${values.beneficiary}`);
              } else {
                  const { error } = await supabase.from('companies').insert({ name: values.beneficiary }).select().single();
                  if (error) throw error;
                  toast.success(`Created new company: ${values.beneficiary}`);
              }
              // Refresh beneficiaries list
              await queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
          } catch (err) {
              console.error("Failed to auto-create beneficiary", err);
              toast.error("Failed to create new beneficiary record, saving expense anyway.");
          }
      }

      const currentFiles = values.attachments_jsonb || [];
      const newFilesToUpload = currentFiles.filter((f): f is File => f instanceof File);
      const existingFiles = currentFiles.filter((f): f is FileMetadata => !(f instanceof File));
      
      const uploadedFilesMetadata = [...existingFiles];

      for (const file of newFilesToUpload) {
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `expense-attachments/${values.project_id}/${Date.now()}-${sanitizedFileName}`;
          
          const { error: uploadError } = await supabase.storage.from('expense').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          
          const { data: urlData } = supabase.storage.from('expense').getPublicUrl(filePath);
          
          uploadedFilesMetadata.push({
              name: file.name,
              url: urlData.publicUrl,
              size: file.size,
              type: file.type,
              storagePath: filePath
          });
      }

      const terms = values.payment_terms || [];
      const termStatuses = terms.map(t => t.status || 'Pending');
      let statusToSave = 'Pending';
      
      if (termStatuses.some(s => s === 'Rejected')) statusToSave = 'Rejected';
      else if (termStatuses.some(s => s === 'On review')) statusToSave = 'On review';
      else if (termStatuses.length > 0 && termStatuses.every(s => s === 'Paid')) statusToSave = 'Paid';
      else if (termStatuses.length > 0 && termStatuses.every(s => s === 'Requested')) statusToSave = 'Requested';

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

      const { error: updateError } = await supabase.from('expenses').update({
        project_id: values.project_id,
        created_by: values.created_by,
        purpose_payment: values.purpose_payment,
        beneficiary: values.beneficiary,
        tf_amount: values.tf_amount,
        status_expense: statusToSave,
        remarks: values.remarks,
        custom_properties: {
            ...values.custom_properties,
            ai_review_notes: values.ai_review_notes
        },
        payment_terms: values.payment_terms?.map(term => ({
            ...term,
            request_date: term.request_date ? term.request_date.toISOString() : null,
            release_date: term.release_date ? term.release_date.toISOString() : null,
        })),
        bank_account_id: (selectedAccount && !isTempAccount) ? selectedAccount.id : null,
        account_bank: bankDetails,
        attachments_jsonb: uploadedFilesMetadata,
        updated_at: new Date().toISOString()
      }).eq('id', expense.id);

      if (updateError) throw updateError;

      toast.success("Expense updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense_details', expense.id] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update expense.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isExtracting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-w-lg md:max-w-xl sm:max-h-[95vh] flex flex-col p-0 sm:p-6 sm:rounded-lg">
          <DialogHeader className="p-4 sm:p-0">
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="edit-expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto p-4 sm:p-0">
              
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
                    <div className="text-xs text-muted-foreground mb-1 whitespace-normal">
                        Upload invoice or receipt to auto-fill details (Image & PDF supported)
                    </div>
                    <FormControl>
                      <FileUploader
                        value={field.value || []}
                        onValueChange={(files) => handleFilesChange(files)}
                        maxFiles={5}
                        maxSize={20971520}
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 'application/pdf': ['.pdf'] }}
                        disabled={isFormDisabled}
                      />
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
                        variant="outline" 
                        size="sm" 
                        className="w-fit justify-start h-auto px-3 py-1 text-sm font-medium text-foreground hover:text-primary disabled:opacity-100 disabled:cursor-default"
                        disabled={isExtracting || !watch('attachments_jsonb')?.length}
                        onClick={handleRunAiCheck}
                    >
                        <Wand2 className="h-4 w-4 text-purple-500 mr-2" />
                        AI Review Instructions 
                        {isExtracting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
                name="project_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Project</FormLabel>
                    <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto whitespace-normal text-left", !field.value && "text-muted-foreground")} disabled={isFormDisabled}>
                            <span className="truncate flex-1 text-left whitespace-normal break-words">{field.value ? projects.find((project) => project.id === field.value)?.name : "Select a project"}</span>
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
                                            {project.client_company_name || project.client_company_name}
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

              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC (Person In Charge)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || user?.id} disabled={isFormDisabled || projectMembers.length === 0}>
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
                    </div>
                    <FormControl>
                      <Input placeholder="Enter purpose of payment" {...field} value={field.value || ''} disabled={isFormDisabled} />
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
                            {beneficiarySearch && !beneficiaries.some(b => b.name.toLowerCase() === beneficiarySearch.toLowerCase()) && (
                                <CommandItem 
                                    value={beneficiarySearch} 
                                    onSelect={() => { 
                                        form.setValue("beneficiary", beneficiarySearch); 
                                        setBeneficiary({ id: 'new', name: beneficiarySearch, type: 'company' }); // Default to company, can be changed later or detected by AI
                                        setBeneficiaryPopoverOpen(false); 
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Use "{beneficiarySearch}"
                                </CommandItem>
                            )}
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
                    {canManageBankAccounts && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsBankAccountFormOpen(true)} disabled={!beneficiary || isFormDisabled}>
                        <Plus className="mr-2 h-4 w-4" /> Add New
                      </Button>
                    )}
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
                            <FormItem><FormLabel className="text-xs">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled}><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Requested">Requested</SelectItem><SelectItem value="On review">On review</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                          )} />
                        </div>
                        
                        {/* Conditional Status Remarks Field */}
                        {['Pending', 'Rejected'].includes(watch(`payment_terms.${index}.status`) || '') && (
                            <FormField control={form.control} name={`payment_terms.${index}.status_remarks`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Status Note (Required for {watch(`payment_terms.${index}.status`)})</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder={`Enter reason for ${watch(`payment_terms.${index}.status`)}...`} 
                                            {...field} 
                                            value={field.value || ''}
                                            disabled={isFormDisabled} 
                                            className="min-h-[60px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ amount: null, request_type: 'Requested', request_date: new Date(), release_date: undefined, status: 'Requested', status_remarks: null })} disabled={isFormDisabled}>
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
          <DialogFooter className="p-4 sm:p-0 sm:pt-4 border-t sm:border-t-0 mt-auto">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isFormDisabled}>Cancel</Button>
            <Button type="submit" form="edit-expense-form" disabled={isFormDisabled}>
              {(isSubmitting || isExtracting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExtracting ? 'Analyzing...' : 'Save Changes'}
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
              const { data } = await supabase.rpc('get_beneficiary_bank_accounts', {
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

export default EditExpenseDialog;