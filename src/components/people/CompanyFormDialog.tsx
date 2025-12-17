import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Company, CustomProperty } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Building } from "lucide-react";
import ImageUploader from '../ui/ImageUploader';
import AddressAutocompleteInput from '../AddressAutocompleteInput';
import CustomPropertyInput from '../settings/CustomPropertyInput';
import { useDragScrollY } from '@/hooks/useDragScrollY';

interface CompanyFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company | null;
    onSuccess?: (company: Company) => void;
    initialValues?: Partial<CompanyFormData>;
}

const formSchema = z.object({
    name: z.string().min(1, "Company name is required"),
    legal_name: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable().or(z.literal('')),
    custom_properties: z.record(z.any()).optional()
});

type CompanyFormData = z.infer<typeof formSchema>;

const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({ open, onOpenChange, company, onSuccess, initialValues }) => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useDragScrollY<HTMLDivElement>();

    const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CustomProperty[]>({
        queryKey: ['custom_properties', 'company'],
        queryFn: async () => {
            const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'company').order('label');
            if (error) throw error;
            return data;
        },
    });

    const form = useForm<CompanyFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {},
    });

    useEffect(() => {
        if (open) {
            if (company) {
                form.reset({
                    name: company.name,
                    legal_name: company.legal_name,
                    address: company.address,
                    logo_url: company.logo_url,
                    custom_properties: company.custom_properties || {},
                });
            } else {
                form.reset({
                    name: '',
                    legal_name: '',
                    address: '',
                    logo_url: '',
                    custom_properties: {},
                    ...initialValues,
                });
            }
        }
    }, [company, open, form, initialValues]);

    const onSubmit = async (values: CompanyFormData) => {
        setIsSubmitting(true);
        
        const submissionData = {
            ...values,
            custom_properties: values.custom_properties || {},
        };

        let data;
        let error;
        if (company) {
            ({ data, error } = await supabase.from('companies').update(submissionData).eq('id', company.id).select().single());
        } else {
            ({ data, error } = await supabase.from('companies').insert(submissionData).select().single());
        }

        if (error) {
            toast.error(`Failed to save company: ${error.message}`);
        } else if (data) {
            toast.success(`Company ${company ? 'updated' : 'created'} successfully.`);
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            onSuccess?.(data as Company);
            onOpenChange(false);
        }
        setIsSubmitting(false);
    };

    const renderCustomField = (prop: CustomProperty) => {
        return (
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
                            bucket="company-logos"
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-w-lg grid grid-rows-[auto_1fr_auto] sm:max-h-[85vh] p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                    <DialogDescription>
                        {company ? `Updating information for ${company.name}.` : 'Enter the details for the new company.'}
                    </DialogDescription>
                </DialogHeader>
                <div ref={scrollRef} className="h-full overflow-y-auto p-4 cursor-grab active:cursor-grabbing select-none">
                        <Form {...form}>
                            <form id="company-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="logo_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ImageUploader
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    bucket="company-logos"
                                                    label="Company Logo"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Acme Inc." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="legal_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Legal Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Acme Corporation" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl><AddressAutocompleteInput value={field.value || ''} onChange={field.onChange} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {isLoadingProperties ? (
                                    <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                ) : properties.map(renderCustomField)}
                            </form>
                        </Form>
                </div>
                <DialogFooter className="p-4 border-t">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" form="company-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {company ? 'Save Changes' : 'Create Company'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CompanyFormDialog;