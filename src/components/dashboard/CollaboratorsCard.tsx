import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";

interface CollaboratorsCardProps {
  collaborators: any[];
}

const CollaboratorsCard = ({ collaborators }: CollaboratorsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <TooltipProvider>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full p-6">
            <div className="flex items-center justify-between">
              <CardTitle>Collaborators</CardTitle>
              <div className="flex items-center gap-4">
                {!isOpen && (
                  <div className="flex items-center -space-x-2">
                    {collaborators.slice(0, 5).map(c => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 border-2 border-card">
                            <AvatarImage src={c.avatar_url || undefined} alt={c.name} />
                            <AvatarFallback>{c.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{c.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collaborator</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Tasks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collaborators.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={c.avatar_url || undefined} alt={c.name} />
                              <AvatarFallback>{c.initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium whitespace-nowrap">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{c.projectCount}</TableCell>
                        <TableCell className="text-right font-medium">{c.taskCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </TooltipProvider>
    </Card>
  );
};

export default CollaboratorsCard;