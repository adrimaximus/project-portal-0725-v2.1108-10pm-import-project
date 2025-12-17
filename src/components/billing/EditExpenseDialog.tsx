import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import FileUploader, { FileMetadata } from "@/components/ui/FileUploader";

const formSchema = z.object({
  beneficiary: z.string().min(1, "Beneficiary is required"),
  tf_amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  purpose_payment: z.string().optional(),
  remarks: z.string().optional(),
  status_expense: z.string(),
  project_id: z.string().optional(),
  created_by: z.string().optional(), // PIC
  attachments: z.array(z.any()).optional().default([]),
});

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditExpenseDialog = ({ expense: propExpense, open, onOpenChange }: EditExpenseDialogProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full expense details including attachments and current PIC
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
    initialData: propExpense as any // Fallback to prop
  });

  const { data: picOptions } = useQuery({
    queryKey: ['pics'],
    queryFn: async () => {
      // Fetch users who are likely PICs (e.g., all profiles)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('status', 'active');
        
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        name: (p.first_name || p.last_name) 
          ? `${p.first_name || ''} ${p.last_name || ''}`.trim() 
          : p.email
      }));
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiary: "",
      tf_amount: 0,
      purpose_payment: "",
      remarks: "",
      status_expense: "Pending",
      created_by: "",
      attachments: [],
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        beneficiary: expense.beneficiary,
        tf_amount: expense.tf_amount,
        purpose_payment: (expense as any).purpose_payment || "",
        remarks: expense.remarks || "",
        status_expense: expense.status_expense,
        project_id: expense.project_id,
        created_by: expense.created_by || "",
        // Important: Load existing attachments from jsonb
        attachments: (expense as any).attachments_jsonb || [], 
      });
    }
  }, [expense, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!expense) return;
    setIsSubmitting(true);

    try {
      // Handle file uploads
      let finalAttachments: FileMetadata[] = [];
      const existingAttachments = values.attachments.filter((f: any) => !(f instanceof File)) as FileMetadata[];
      const newFiles = values.attachments.filter((f: any) => f instanceof File) as File[];

      // Keep existing files
      finalAttachments = [...existingAttachments];

      // Upload new files
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${expense.project_id}/${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('project-files')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(filePath);

          finalAttachments.push({
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type,
            storagePath: filePath
          });
        }
      }

      const { error } = await supabase
        .from("expenses")
        .update({
          beneficiary: values.beneficiary,
          tf_amount: values.tf_amount,
          purpose_payment: values.purpose_payment,
          remarks: values.remarks,
          status_expense: values.status_expense,
          created_by: values.created_by || null,
          attachments_jsonb: finalAttachments as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", expense.id);

      if (error) throw error;

      toast.success("Expense updated successfully");
      onOpenChange(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense_details", expense.id] });
      
    } catch (error: any) {
      toast.error("Failed to update expense", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="beneficiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tf_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PIC" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {picOptions?.map((pic) => (
                          <SelectItem key={pic.id} value={pic.id}>
                            {pic.name}
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
                name="status_expense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="On review">On review</SelectItem>
                        <SelectItem value="Requested">Requested</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    <FormControl>
                      <FileUploader 
                        value={field.value} 
                        onValueChange={field.onChange}
                        maxFiles={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;