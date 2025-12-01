import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PublicationStats from "@/components/publication/PublicationStats";
import CampaignCard from "@/components/publication/CampaignCard";
import CreateCampaignDialog from "@/components/publication/CreateCampaignDialog";

const Publication = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["publication_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publication_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Publication</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Manage your outreach campaigns, track media lists, and monitor publication statuses directly linked to your Google Sheets.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0 shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Section */}
      <PublicationStats campaigns={campaigns || []} />

      {/* Content Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
          </div>
        ) : filteredCampaigns?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No campaigns found</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto mb-6">
              Get started by creating your first publication campaign to track your media outreach.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns?.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      <CreateCampaignDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default Publication;