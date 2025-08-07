import { useState } from "react";
import { Project, Task, User, Activity } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectHeader } from "./ProjectHeader";
import ProjectActivityFeed from "./ProjectActivityFeed";
import { ProjectTasks } from "./ProjectTasks";
import {
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  History,
} from "lucide-react";

// ... (rest of the file remains the same)