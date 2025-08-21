import { useFieldArray, Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { FormControl, FormField, FormItem, FormMessage } from '../ui/form';

interface DynamicInputListProps {
  control: Control<any>;
  name: string;
  placeholder: string;
  inputType?: string;
  disabled?: boolean;
}

const DynamicInputList = ({ control, name, placeholder, inputType = 'text', disabled = false }: DynamicInputListProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`${name}.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input {...field} placeholder={placeholder} type={inputType} disabled={disabled} />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1 || disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
        disabled={disabled}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add
      </Button>
    </div>
  );
};

export default DynamicInputList;