import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUpload from "@/components/project-detail/FileUpload";

interface FileUploadFormProps {
  control: Control<any>;
}

export function FileUploadForm({ control }: FileUploadFormProps) {
  return (
    <FormField
      control={control}
      name="files"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Attachments</FormLabel>
          <FormControl>
            <FileUpload files={field.value || []} onFilesChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}