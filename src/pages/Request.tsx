import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectDetailsForm } from "@/components/request/ProjectDetailsForm";
import { FileUploadForm } from "@/components/request/FileUploadForm";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  projectOwner: z.string().min(1, "Project owner is required"),
  deadline: z.date({ required_error: "Deadline is required." }),
  assignedTo: z.array(z.string()).min(1, "At least one person must be assigned"),
  files: z.array(z.instanceof(File)).optional(),
});

export default function RequestPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      projectDescription: "",
      assignedTo: [],
      files: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success("Project request submitted successfully!");
    form.reset();
  }

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">New Project Request</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectDetailsForm control={form.control} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadForm control={form.control} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}