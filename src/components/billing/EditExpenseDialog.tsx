import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, ScanLine, Check, ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  beneficiary: z.string().min(1, "Beneficiary is required"),
  tf_amount: z.string().min(1, "Amount is required"),
  due_date: z.string().optional(),
  status_expense: z.string().default("Proposed"),
  remarks: z.string().optional(),
  purpose_payment: z.string().optional(),
});

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

const EditExpenseDialog = ({ open, onOpenChange, expense }: EditExpenseDialogProps) => {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [beneficiaryPopoverOpen, setBeneficiaryPopoverOpen] = useState(false);
  const [detectedBeneficiaryType, setDetectedBeneficiaryType] = useState<'person' | 'company' | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: "",
      beneficiary: "",
      tf_amount: "",
      due_date: "",
      status_expense: "Proposed",
      remarks: "",
      purpose_payment: "",
    },
  });

  // Fetch available projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch beneficiaries (people and companies)
  const { data: beneficiaries = [], isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, full_name, company');
      
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name');

      if (peopleError || companiesError) throw new Error("Failed to fetch beneficiaries");

      const peopleList = people?.map(p => ({ 
        id: p.id, 
        name: p.full_name, 
        type: 'person' as const,
        description: p.company 
      })) || [];

      const companiesList = companies?.map(c => ({ 
        id: c.id, 
        name: c.name, 
        type: 'company' as const,
        description: 'Company' 
      })) || [];

      return [...peopleList, ...companiesList].sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        project_id: expense.project_id,
        beneficiary: expense.beneficiary,
        tf_amount: expense.tf_amount.toString(),
        due_date: expense.due_date ? new Date(expense.due_date).toISOString().split('T')[0] : "",
        status_expense: expense.status_expense,
        remarks: expense.remarks || "",
        purpose_payment: (expense as any).purpose_payment || "",
      });
    }
  }, [expense, form]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);
    // Explicitly ask AI to identify if the beneficiary is a person or company
    formData.append('prompt', 'Extract expense details including amount, date, beneficiary name, and determine if the beneficiary is a "person" or "company" (return as beneficiary_type field). Return JSON.');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: formData,
      });

      if (error) throw error;

      if (data) {
        if (data.amount) form.setValue("tf_amount", data.amount.toString());
        if (data.date) form.setValue("due_date", data.date);
        if (data.beneficiary) {
          form.setValue("beneficiary", data.beneficiary);
          // Check if beneficiary exists in our list
          const exists = beneficiaries.some(b => b.name.toLowerCase() === data.beneficiary.toLowerCase());
          if (!exists && data.beneficiary_type) {
            setDetectedBeneficiaryType(data.beneficiary_type.toLowerCase() === 'company' ? 'company' : 'person');
            toast.info(`Detected new beneficiary: ${data.beneficiary} (${data.beneficiary_type})`);
          }
        }
        if (data.description) form.setValue("remarks", data.description);
        toast.success("Document analyzed successfully");
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error("Failed to analyze document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ensureBeneficiaryExists = async (name: string) => {
    // Check if exists in current list
    const exists = beneficiaries.find(b => b.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    // Determine type: use AI detected type, or default to 'person' if it looks like a name, or just 'person' as fallback
    const type = detectedBeneficiaryType || 'person'; // Default to person if unknown

    try {
      if (type === 'company') {
        const { error } = await supabase.from('companies').insert({ name: name });
        if (error) throw error;
        toast.success(`Created new company: ${name}`);
      } else {
        const { error } = await supabase.from('people').insert({ full_name: name });
        if (error) throw error;
        toast.success(`Created new person: ${name}`);
      }
      // Invalidate beneficiaries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    } catch (error) {
      console.error("Error creating beneficiary:", error);
      toast.error(`Failed to create new ${type} record for ${name}`);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!expense) return;

    try {
      // 1. Ensure beneficiary exists in People or Companies
      await ensureBeneficiaryExists(values.beneficiary);

      // 2. Update Expense
      const { error } = await supabase
        .from('expenses')
        .update({
          project_id: values.project_id,
          beneficiary: values.beneficiary,
          tf_amount: Number(values.tf_amount),
          due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
          status_expense: values.status_expense,
          remarks: values.remarks,
          custom_properties: {
            ...((expense.custom_properties as object) || {}),
            purpose_payment: values.purpose_payment
          }
        })
        .eq('id', expense.id);

      if (error) throw error;

      toast.success("Expense updated successfully");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update expense", { description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2 text-sm font-medium">
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                {isAnalyzing ? "Analyzing document..." : "Scan Invoice / Receipt with AI"}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
            </div>
            {isAnalyzing && <span className="text-xs text-muted-foreground">Extracting data...</span>}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        >
                          {field.value || "Select or type beneficiary"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search beneficiary..." />
                        <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">
                          <p>No beneficiary found.</p>
                          <Button 
                            variant="ghost" 
                            className="mt-2 w-full justify-start h-auto py-1 px-2 text-primary"
                            onClick={() => {
                              // Allow setting a custom value not in the list
                              // We grab the value from the input which might not be directly accessible in standard CommandEmpty
                              // So we rely on typing in the combobox or just use the field value if we can capture input state
                              // Shadcn Command doesn't easily expose input value in Empty state without controlled input.
                              // Simplified approach: Just tell user to type.
                              // Actually, standard shadcn combobox filters.
                              // We need a Creatable pattern.
                            }}
                          >
                            Tip: Type exact name to create new
                          </Button>
                        </CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
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
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">{item.type} • {item.description}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tf_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (IDR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose_payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Server Maintenance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status_expense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Proposed">Proposed</SelectItem>
                      <SelectItem value="Requested">Requested</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;