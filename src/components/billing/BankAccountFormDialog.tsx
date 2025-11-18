import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { BankAccount } from '@/types';

interface BankAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  account?: Partial<BankAccount> | null; // For editing
  ownerId?: string; // For creating
  ownerType?: 'person' | 'company'; // For creating
}

const bankAccountSchema = z.object({
  account_name: z.string().min(1, "Beneficiary name is required."),
  account_number: z.string().min(1, "Account number is required."),
  bank_name: z.string().min(1, "Bank name is required."),
  swift_code: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

const BankAccountFormDialog = ({ open, onOpenChange, onSuccess, account, ownerId, ownerType }: BankAccountFormDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      account_name: '',
      account_number: '',
      bank_name: '',
      swift_code: '',
      country: '',
      city: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (account) {
        form.reset({
          account_name: account.account_name || '',
          account_number: account.account_number || '',
          bank_name: account.bank_name || '',
          swift_code: account.swift_code || '',
          country: account.country || '',
          city: account.city || '',
        });
      } else {
        form.reset();
      }
    }
  }, [account, open, form]);

  const onSubmit = async (values: BankAccountFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        owner_id: account ? account.owner_id : ownerId,
        owner_type: account ? account.owner_type : ownerType,
      };

      const promise = account?.id
        ? supabase.from('bank_accounts').update(payload).eq('id', account.id)
        : supabase.from('bank_accounts').insert(payload).select('id').single();

      const { error } = await promise;

      if (error) throw error;

      toast.success(`Bank account ${account ? 'updated' : 'added'} successfully.`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to save bank account.`, { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit' : 'Add New'} Bank Account</DialogTitle>
          <DialogDescription>
            Enter the details for the bank account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="account_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Beneficiary Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="account_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bank_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="swift_code" render={({ field }) => (
              <FormItem>
                <FormLabel>SWIFT Code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Account
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BankAccountFormDialog;