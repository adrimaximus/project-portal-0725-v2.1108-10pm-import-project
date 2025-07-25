import { useState } from "react";
import { useParams } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import { services as allServices } from "@/data/services";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { File, Activity, CreditCard, Wallet, CalendarDays, Ticket, CalendarClock, Pencil } from "lucide-react";
import ProjectComments, { Comment } from "@/components/ProjectComments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dummy data for initial comments, one with an attachment
const initialComments: Comment[] = [
  {
    id: 1,
    user: {
      name: "Sophia Davis",
      avatar: "https://i.pravatar.cc/150?u=sophia",
    },
    text: "Great progress on the mockups! Just one suggestion: can we try a different color palette for the main CTA button?",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    user: {
      name: "Liam Brown",
      avatar: "https://i.pravatar.cc/150?u=liam",
    },
    text: "Sure, I'll prepare a few alternatives. I've also attached the latest wireframes for the user dashboard.",
    timestamp: "1 day ago",
    attachment: {
        name: "dashboard-wireframe.png",
        url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=2070&auto=format&fit=crop",
        type: 'image'
    }
  },
];

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectData = dummyProjects.find((p) => p.id === projectId);

  const [project, setProject] = useState<Project | undefined>(projectData);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const ticketCount = comments.filter(comment => comment.isTicket).length;

  if (!project) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">Project not found.</p>
        </div>
      </PortalLayout>
    );
  }

  const handleEdit = () => {
    setEditedProject({ ...project });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleSave = () => {
    if (editedProject) {
      setProject(editedProject);
      // In a real app, you would make an API call here to save the data
    }
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProject) return;
    const { name, value } = e.target;
    setEditedProject({ ...editedProject, [name]: value });
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (!editedProject) return;
    setEditedProject({ ...editedProject, [name]: value as any });
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate', date: Date | undefined) => {
    if (!editedProject || !date) return;
    setEditedProject({ ...editedProject, [name]: date.toISOString().split('T')[0] });
  };

  const handleBudgetChange = (value: number | undefined) => {
    if (!editedProject) return;
    setEditedProject({ ...editedProject, budget: value || 0 });
  };

  const projectServices = allServices.filter(service => 
    project.services.includes(service.title)
  );

  // Dummy data for recent activity
  const recentActivity = [
    {
      id: 1,
      user: {
        name: "Olivia Martin",
        avatar: "https://i.pravatar.cc/150?u=olivia",
      },
      action: "updated the project deadline to December 15, 2024.",
      timestamp: "2024-07-20T10:30:00Z",
    },
    {
      id: 2,
      user: {
        name: "Jackson Lee",
        avatar: "https://i.pravatar.cc/150?u=jackson",
      },
      action: "attached a new file: 'design_mockups_v2.zip'.",
      timestamp: "2024-07-19T15:00:00Z",
    },
    {
      id: 3,
      user: {
        name: project.assignedTo[0].name,
        avatar: project.assignedTo[0].avatar,
      },
      action: "changed the project status to 'In Progress'.",
      timestamp: "2024-07-18T09:00:00Z",
    },
  ];

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getStatusBadgeVariant = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "On Hold":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status: Project["paymentStatus"]) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Pending":
        return "secondary";
      case "Overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const budgetFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(project.budget);

  const deadlineFormatted = new Date(project.deadline).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const paymentDueDateFormatted = project.paymentDueDate
    ? new Date(project.paymentDueDate).toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : "Not Set";

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow">
            {isEditing && editedProject ? (
              <div className="space-y-2">
                <Label htmlFor="name" className="sr-only">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={editedProject.name}
                  onChange={handleInputChange}
                  className="text-3xl font-bold tracking-tight h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Project Name"
                />
                <Label htmlFor="description" className="sr-only">Project Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={editedProject.description}
                  onChange={handleInputChange}
                  placeholder="Project description"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-1">{project.description}</p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            ) : (
              <Button onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Project
              </Button>
            )}
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing && editedProject ? (
                <Select
                  value={editedProject.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Progress">WIP</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status === "In Progress" ? "WIP" : project.status}
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing && editedProject ? (
                <Select
                  value={editedProject.paymentStatus}
                  onValueChange={(value) => handleSelectChange('paymentStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getPaymentStatusBadgeVariant(project.paymentStatus)}>
                  {project.paymentStatus}
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Date Payment</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing && editedProject ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editedProject.paymentDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {editedProject.paymentDueDate ? format(new Date(editedProject.paymentDueDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editedProject.paymentDueDate ? new Date(editedProject.paymentDueDate) : undefined}
                      onSelect={(date) => handleDateChange('paymentDueDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="text-xl font-bold">{paymentDueDateFormatted}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{ticketCount}</div>
              <p className="text-xs text-muted-foreground">{ticketCount} tickets created</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing && editedProject ? (
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    IDR
                  </span>
                  <CurrencyInput
                    value={editedProject.budget}
                    onChange={handleBudgetChange}
                    className="pl-12"
                  />
                </div>
              ) : (
                <div className="text-xl font-bold">{budgetFormatted}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Due Date</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing && editedProject ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editedProject.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {editedProject.deadline ? format(new Date(editedProject.deadline), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(editedProject.deadline)}
                      onSelect={(date) => handleDateChange('deadline', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="text-xl font-bold">{deadlineFormatted}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={65} className="w-full" />
                  <p className="text-sm text-muted-foreground">65% complete</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {projectServices.map((service) => (
                    <div
                      key={service.title}
                      className="flex items-center gap-2 rounded-lg bg-muted p-2"
                    >
                      <div className={cn("rounded-md p-1", service.iconColor)}>
                        <service.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{service.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <ul className="space-y-6">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                          <AvatarFallback>
                            {activity.user.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <p className="text-sm">
                            <span className="font-semibold">{activity.user.name}</span>
                            {' '}
                            {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatActivityDate(activity.timestamp)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
              </CardContent>
            </Card>

            <ProjectComments comments={comments} setComments={setComments} />

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="flex items-center -space-x-2">
                    {project.assignedTo.map((user, index) => (
                      <Tooltip key={index} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-card">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-card",
                                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              )}
                              title={user.status === 'online' ? 'Online' : 'Offline'}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="hover:underline cursor-pointer">project_brief.pdf</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="hover:underline cursor-pointer">design_mockups.zip</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;