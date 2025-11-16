import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const expenseSchema = z.object({
  beneficiary: z.string().min(1, "Beneficiary is required"),
  tf_amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  status_expense: z.string().min(1, "Status is required"),
  remarks: z.string().optional(),
});

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

const EditExpenseDialog = ({ open, onOpenChange, expense }: EditExpenseDialogProps) => {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      beneficiary: "",
      tf_amount: 0,
      status_expense: "Pending",
      remarks: "",
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        beneficiary: expense.beneficiary,
        tf_amount: expense.tf_amount,
        status_expense: expense.status_expense,
        remarks: expense.remarks || "",
      });
    }
  }, [expense, reset]);

  const mutation = useMutation({
    mutationFn: async (updatedData: z.infer<typeof expenseSchema>) => {
      if (!expense) throw new Error("No expense to update");
      const { error } = await supabase
        .from("expenses")
        .update(updatedData)
        .eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Error updating expense: ${error.message}`);
    },
  });

  const onSubmit = (data: z.infer<typeof expenseSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the details for this expense. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="beneficiary" className="text-right">
              Beneficiary
            </Label>
            <Controller
              name="beneficiary"
              control={control}
              render={({ field }) => (
                <Input id="beneficiary" {...field} className="col-span-3" />
              )}
            />
            {errors.beneficiary && <p className="col-span-4 text-red-500 text-sm">{errors.beneficiary.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tf_amount" className="text-right">
              Amount
            </Label>
            <Controller
              name="tf_amount"
              control={control}
              render={({ field }) => (
                <Input id="tf_amount" type="number" {...field} className="col-span-3" />
              )}
            />
            {errors.tf_amount && <p className="col-span-4 text-red-500 text-sm">{errors.tf_amount.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status_expense" className="text-right">
              Status
            </Label>
            <Controller
              name="status_expense"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
             {errors.status_expense && <p className="col-span-4 text-red-500 text-sm">{errors.status_expense.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remarks" className="text-right">
              Remarks
            </Label>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <Textarea id="remarks" {...field} className="col-span-3" />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;