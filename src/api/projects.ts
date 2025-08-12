import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types";

export const createProjectWithServices = async (
  projectDetails: { name: string; description: string; category: string; },
  selectedServices: Service[]
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // 1. Create the project
  const { data: newProject, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: projectDetails.name,
      description: projectDetails.description,
      category: projectDetails.category,
      created_by: user.id,
      status: 'Briefing' // Default status
    })
    .select("id")
    .single();

  if (projectError) {
    console.error("Error creating project:", projectError);
    throw projectError;
  }

  if (!newProject) {
    throw new Error("Project creation failed, no ID returned.");
  }

  // 2. Link services to the project
  if (selectedServices.length > 0) {
    const servicesToInsert = selectedServices.map((service) => ({
      project_id: newProject.id,
      service_title: service.title,
    }));

    const { error: servicesError } = await supabase
      .from("project_services")
      .insert(servicesToInsert);

    if (servicesError) {
      console.error("Error linking services:", servicesError);
      // Rollback project creation if services fail to link
      await supabase.from("projects").delete().eq("id", newProject.id);
      throw servicesError;
    }
  }

  return newProject;
};