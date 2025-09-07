import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Building, Image as ImageIcon } from "lucide-react";
import { Company } from '@/types';
import AddressAutocompleteInput from '../AddressAutocompleteInput';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Label } from '../ui/label';

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Company, 'id' | 'created_at' | 'updated_at'>, file: File | null) => void;
  company: Company | null;
  isSaving: boolean;
}

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  legal_name: z.string().optional(),
  address: z.string().optional(),
  billing_address: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const CompanyFormDialog = ({ open, onOpenChange, onSave, company, isSaving }: CompanyFormDialogProps) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', legal_name: '', address: '', billing_address: '' }
  });

  useEffect(() => {
    if (open) {
      if (company) {
        form.reset({
          name: company.name,
          legal_name: company.legal_name || '',
          address: company.address || '',
          billing_address: company.billing_address || '',
        });
        setLogoPreview(company.logo_url || null);
      } else {
        form.reset({ name: '', legal_name: '', address: '', billing_address: '' });
        setLogoPreview(null);
      }
      setLogoFile(null);
    }
  }, [company, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: CompanyFormValues) => {
    onSave({ ...values, logo_url: company?.logo_url }, logoFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          <DialogDescription>Fill in the details for the company profile.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-md">
                <AvatarImage src={logoPreview || undefined} className="object-contain" />
                <AvatarFallback className="rounded-md"><Building className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="text-xs" />
              </div>
            </div>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="legal_name" render={({ field }) => (
              <FormItem><FormLabel>Legal Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Address</FormLabel><FormControl><AddressAutocompleteInput value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="billing_address" render={({ field }) => (
              <FormItem><FormLabel>Billing Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="pt-4 sticky bottom-0 bg-background">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyFormDialog;