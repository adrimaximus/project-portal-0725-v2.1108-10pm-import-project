import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Company, CompanyProperty } from '@/types';
import ImageUploadField from '../ImageUploadField';
import AddressAutocompleteInput from '../AddressAutocompleteInput';

const CompanyFormDialog = ({ open, onOpenChange, company }: { open: boolean, onOpenChange: (open: boolean) => void, company: Company | null }) => {
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CompanyProperty[]>({
    queryKey: ['company_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_properties').select('*').order('label');
      if (error) throw error;
      return data;
    },
  });

  const baseSchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    legal_name: z.string().optional(),
    address: z.string().optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
  });

  const [dynamicSchema, setDynamicSchema] = React.useState<z.AnyZodObject>(baseSchema);

  useEffect(() => {
    if (properties.length > 0) {
      const schema = properties.reduce((schema, prop) => {
        let fieldSchema;
        switch (prop.type) {
          case 'number':
            fieldSchema = z.coerce.number().optional();
            break;
          case 'date':
            fieldSchema = z.string().optional();
            break;
          case 'select':
            fieldSchema = z.string().optional();
            break;
          case 'image':
            fieldSchema = z.string().url().optional().nullable();
            break;
          default:
            fieldSchema = z.string().optional();
        }
        return schema.extend({ [prop.name]: fieldSchema });
      }, baseSchema);
      setDynamicSchema(schema);
    }
  }, [properties, baseSchema]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(dynamicSchema),
  });

  useEffect(() => {
    if (open) {
      if (company) {
        const { custom_properties, ...companyData } = company;
        reset({ ...companyData, ...custom_properties });
      } else {
        const defaultValues = properties.reduce((acc, prop) => ({ ...acc, [prop.name]: '' }), {});
        reset({ name: '', legal_name: '', address: '', logo_url: '', ...defaultValues });
      }
    }
  }, [company, open, reset, properties]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const standardFields = ['name', 'legal_name', 'address', 'logo_url'];
      const companyData: Partial<Company> = {};
      const custom_properties: Record<string, any> = {};

      for (const key in values) {
        if (standardFields.includes(key)) {
          companyData[key] = values[key];
        } else {
          custom_properties[key] = values[key];
        }
      }
      companyData.custom_properties = custom_properties;

      if (company) {
        const { error } = await supabase.from('companies').update(companyData).eq('id', company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('companies').insert(companyData as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Company ${company ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save company.', { description: error.message });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const renderField = (prop: CompanyProperty) => {
    const fieldName = prop.name;
    switch (prop.type) {
      case 'number':
        return <Input id={fieldName} type="number" {...register(fieldName)} />;
      case 'date':
        return <Input id={fieldName} type="date" {...register(fieldName)} />;
      case 'select':
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger><SelectValue placeholder={`Select ${prop.label}`} /></SelectTrigger>
                <SelectContent>
                  {prop.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        );
      case 'image':
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => <ImageUploadField value={field.value} onChange={field.onChange} />}
          />
        );
      default:
        return <Input id={fieldName} {...register(fieldName)} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          <DialogDescription>Fill in the details for the company.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-6 py-4 -mx-6">
          <div className="px-6">
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message as string}</p>}
          </div>
          <div className="px-6">
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input id="legal_name" {...register('legal_name')} />
          </div>
          <div className="px-6">
            <Label htmlFor="address">Address</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => {
                let venueName = '';
                let venueAddress = '';
                let fullQuery = field.value || '';

                try {
                  const parsed = JSON.parse(field.value || '{}');
                  if (parsed.name && parsed.address) {
                    venueName = parsed.name;
                    venueAddress = parsed.address;
                    fullQuery = `${venueName}, ${venueAddress}`;
                  }
                } catch (e) {
                  // Not a JSON string, use as is
                }

                return (
                  <div>
                    <div className="relative flex items-center">
                      <AddressAutocompleteInput
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                      {field.value && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Get directions"
                          className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MapPin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {field.value && (venueAddress || (!venueName && fullQuery)) && (
                      <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md">
                        {venueName && venueAddress ? (
                          <div>
                            <p className="font-semibold text-foreground">{venueName}</p>
                            <p>{venueAddress}</p>
                          </div>
                        ) : (
                          <p>{field.value}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
          <div className="px-6">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input id="logo_url" {...register('logo_url')} />
            {errors.logo_url && <p className="text-sm text-destructive mt-1">{errors.logo_url.message as string}</p>}
          </div>

          {isLoadingProperties ? (
            <div className="flex justify-center px-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : properties.length > 0 && (
            <div className="space-y-4 border-t pt-4 mt-4 px-6">
              {properties.map(prop => (
                <div key={prop.id}>
                  <Label htmlFor={prop.name}>{prop.label}</Label>
                  {renderField(prop)}
                </div>
              ))}
            </div>
          )}
        
          <DialogFooter className="pt-4 sticky bottom-0 bg-background px-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {company ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyFormDialog;