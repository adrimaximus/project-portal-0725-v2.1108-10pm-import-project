import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PortalLayout from "@/components/PortalLayout";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import { Button } from "@/components/ui/button";
import { Service } from "@/data/services";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  services: z.array(z.string()).min(1, "Please select at least one service."),
  name: z.string().min(1, "Project name is required."),
  description: z.string().min(1, "Description is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  ownerId: z.string().min(1, "Project owner is required."),
});

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      services: [],
      name: "",
      description: "",
    },
  });

  const handleServiceSelectionContinue = (selectedServices: Service[]) => {
    form.setValue(
      "services",
      selectedServices.map((s) => s.title)
    );
    setStep(2);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You must be logged in to create a project.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            name: values.name,
            description: values.description,
            start_date: values.startDate.toISOString(),
            due_date: values.dueDate.toISOString(),
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (projectError) throw projectError;

      const projectId = projectData.id;

      const { error: servicesError } = await supabase
        .from("project_services")
        .insert(
          values.services.map((serviceTitle) => ({
            project_id: projectId,
            service_title: serviceTitle,
          }))
        );

      if (servicesError) throw servicesError;
      
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: values.ownerId,
          role: 'owner'
        });

      if (memberError) throw memberError;


      toast.success("Project created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to create project.", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {step === 1 && (
            <ServiceSelection onContinue={handleServiceSelectionContinue} />
          )}
          {step === 2 && (
            <>
              <ProjectDetailsForm />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Project Request"}
                </Button>
              </div>
            </>
          )}
        </form>
      </FormProvider>
    </PortalLayout>
  );
};

export default RequestPage;