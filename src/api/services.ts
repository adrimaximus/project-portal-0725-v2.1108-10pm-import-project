import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types";
import { getIcon } from "@/lib/icons";

export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from("services").select("*");

  if (error) {
    console.error("Error fetching services:", error);
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map((service) => ({
    title: service.title,
    description: service.description,
    icon: getIcon(service.icon),
    iconColor: service.color,
  }));
};