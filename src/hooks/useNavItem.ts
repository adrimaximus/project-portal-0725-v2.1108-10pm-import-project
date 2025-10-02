import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserNavigationItem } from "@/types";

const fetchNavItem = async (slug: string | undefined): Promise<UserNavigationItem | null> => {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("user_navigation_items")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching nav item:", error);
    throw new Error(error.message);
  }

  return data;
};

export const useNavItem = (slug: string | undefined) => {
  return useQuery<UserNavigationItem | null, Error>({
    queryKey: ["navItem", slug],
    queryFn: () => fetchNavItem(slug),
    enabled: !!slug,
  });
};