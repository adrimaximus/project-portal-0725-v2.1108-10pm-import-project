import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MoreHorizontal, FileSpreadsheet, CalendarDays } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    sheet_url: string;
    created_at: string;
  };
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("publication_campaigns")
        .delete()
        .eq("id", campaign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publication_campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete", { description: error.message });
    },
  });

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {campaign.name}
            </CardTitle>
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1 h-3 w-3" />
              {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(campaign.sheet_url, "_blank")}>
                View Sheet
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate()}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 border border-border/50">
          <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-md shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Linked Sheet</p>
            <p className="text-xs truncate text-foreground font-mono opacity-80">
              {campaign.sheet_url}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button 
          variant="outline" 
          className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground border-dashed hover:border-solid transition-all"
          onClick={() => window.open(campaign.sheet_url, "_blank")}
        >
          Open Campaign
          <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
        </Button>
      </CardFooter>
    </Card>
  );
}