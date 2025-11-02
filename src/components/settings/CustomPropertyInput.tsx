import { Control, useController } from 'react-hook-form';
import { CustomProperty } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ImageUploader from '@/components/ui/ImageUploader';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';

interface CustomPropertyInputProps {
  property: CustomProperty;
  control: Control<any>;
  name: string;
  bucket?: string; // Added bucket prop for image upload
}

const CustomPropertyInput = ({ property, control, name, bucket = "company-logos" }: CustomPropertyInputProps) => {
  const { field } = useController({ name, control });

  const renderInput = () => {
    switch (property.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'phone':
      case 'url':
        return <Input type={property.type} {...field} value={field.value || ''} />;
      case 'textarea':
        return <Textarea {...field} value={field.value || ''} />;
      case 'date':
        return <Input type="date" {...field} value={field.value || ''} />;
      case 'select':
        return (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger><SelectValue placeholder={`Select a ${property.label}`} /></SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multi-select':
        return (
          <MultiSelect
            options={property.options?.map(opt => ({ value: opt, label: opt })) || []}
            value={field.value || []}
            onChange={field.onChange}
            placeholder={`Select multiple ${property.label}`}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={!!field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={name} className="font-normal">{property.label}</Label>
          </div>
        );
      case 'image':
        return <ImageUploader value={field.value} onChange={field.onChange} bucket={bucket} />;
      default:
        return <Input type="text" {...field} value={field.value || ''} />;
    }
  };

  return (
    <div>
      {property.type !== 'checkbox' && <Label htmlFor={name}>{property.label}</Label>}
      <div className="mt-1">
        {renderInput()}
      </div>
    </div>
  );
};

export default CustomPropertyInput;