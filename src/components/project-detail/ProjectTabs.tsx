import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

interface ProjectTabsProps {
  children: React.ReactNode[];
}

const ProjectTabs = ({ children }: ProjectTabsProps) => {
  const [overview, comments] = React.Children.toArray(children);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comments">Comments & Tickets</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        {overview}
      </TabsContent>
      <TabsContent value="comments" className="mt-4">
        {comments}
      </TabsContent>
    </Tabs>
  );
};

export default ProjectTabs;