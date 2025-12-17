import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FileUploader from "@/components/ui/FileUploader";

const formSchema = z.object({
  beneficiary: z.string().min(1, "Beneficiary is required"),
  tf_amount: z.string().min(1, "Amount is required"),
  status_expense: z.string(),
  due_date: z.date().optional().nullable(),
  remarks: z.string().optional(),
  purpose_payment: z.string().optional(),
  attachments_jsonb: z.array(z.any()).optional(),
});

interface EditExpenseDialogProps {
  expense: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
}: EditExpenseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialAttachments, setInitialAttachments] = useState<any[]>([]);

  // Fetch full expense details to get the latest attachments
  const { data: fullExpense, isLoading } = useQuery({
    queryKey: ['expense', expense?.id],
    queryFn: async () => {
      if (!expense?.id) return null;
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expense.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!expense?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiary: expense?.beneficiary || '',
      tf_amount: expense?.tf_amount?.toString() || '',
      status_expense: expense?.status_expense || 'Pending',
      due_date: expense?.due_date ? new Date(expense.due_date) : null,
      remarks: expense?.remarks || "",
      purpose_payment: expense?.purpose_payment || "",
      attachments_jsonb: [],
    },
  });

  useEffect(() => {
    if (fullExpense) {
      const attachments = (fullExpense.attachments_jsonb as any[]) || [];
      setInitialAttachments(attachments);
      
      form.reset({
        beneficiary: fullExpense.beneficiary,
        tf_amount: fullExpense.tf_amount?.toString(),
        status_expense: fullExpense.status_expense,
        due_date: fullExpense.due_date ? new Date(fullExpense.due_date) : null,
        remarks: fullExpense.remarks || "",
        purpose_payment: fullExpense.purpose_payment || "",
        attachments_jsonb: attachments,
      });
    } else if (expense) {
       // Reset form when expense prop changes if fullExpense isn't loaded yet
       form.reset({
        beneficiary: expense.beneficiary,
        tf_amount: expense.tf_amount?.toString(),
        status_expense: expense.status_expense,
        due_date: expense.due_date ? new Date(expense.due_date) : null,
        remarks: expense.remarks || "",
        purpose_payment: expense.purpose_payment || "",
        attachments_jsonb: expense.attachments_jsonb || [],
      });
    }
  }, [fullExpense, form, expense]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!expense?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          beneficiary: values.beneficiary,
          tf_amount: parseFloat(values.tf_amount),
          status_expense: values.status_expense,
          due_date: values.due_date ? values.due_date.toISOString() : null,
          remarks: values.remarks,
          purpose_payment: values.purpose_payment,
          attachments_jsonb: values.attachments_jsonb,
        })
        .eq("id", expense.id);

      if (error) throw error;

      toast({
        title: "Expense updated",
        description: "The expense details have been successfully updated.",
      });

      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", expense.id] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status_expense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
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
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                    <FormLabel>Purpose of Payment</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Server costs, Office supplies" />
                    </FormControl>
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
                    <FormControl>
                      <FileUploader
                        value={field.value || []}
                        onValueChange={field.onChange}
                        bucketName="project-files"
                        folderPath={`expenses/${expense.id}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}