import React, { useState } from "react";
import PortalSidebar from "@/components/PortalSidebar";
import PortalHeader from "@/components/PortalHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/data/services";
import { Search, ArrowLeft, LucideIcon, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Define the type for a service based on the data structure
type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
};

const ServicesPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleServiceSelect = (service: Service) => {
    const isFeatured = service.title === "End to End Services";
    const isAlreadySelected = selectedServices.some(
      (s) => s.title === service.title
    );

    if (isFeatured) {
      // If "End to End" is clicked, it's the only selection or no selection
      setSelectedServices(isAlreadySelected ? [] : [service]);
    } else {
      // For other services, allow multi-select but deselect "End to End"
      let newSelectedServices = selectedServices.filter(
        (s) => s.title !== "End to End Services"
      );
      if (isAlreadySelected) {
        // Deselect the service
        newSelectedServices = newSelectedServices.filter(
          (s) => s.title !== service.title
        );
      } else {
        // Select the service
        newSelectedServices.push(service);
      }
      setSelectedServices(newSelectedServices);
    }
  };

  const featuredService = services.find(
    (s) => s.title === "End to End Services"
  );
  const otherServices = services.filter(
    (s) => s.title !== "End to End Services"
  );

  const filteredServices = otherServices.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (service: Service) => {
    return selectedServices.some((s) => s.title === service.title);
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <PortalSidebar />
      <div className="flex flex-col">
        <PortalHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {step === 1 ? (
            // Step 1: Service Selection
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight">
                Project Support
              </h1>
              <p className="text-muted-foreground">
                Select the services you need for your project. You can select
                multiple services, or choose our end-to-end package.
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search support options..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {featuredService && (
                <Card
                  className={cn(
                    "w-full hover:bg-muted/50 transition-colors cursor-pointer",
                    isSelected(featuredService) && "ring-2 ring-primary"
                  )}
                  onClick={() => handleServiceSelect(featuredService)}
                >
                  <CardContent className="p-6 flex items-center gap-6">
                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        featuredService.iconColor
                      )}
                    >
                      <featuredService.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">
                        {featuredService.title}
                      </h2>
                      <p className="text-muted-foreground">
                        {featuredService.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredServices.map((service) => (
                  <Card
                    key={service.title}
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer h-full",
                      isSelected(service) && "ring-2 ring-primary"
                    )}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div
                        className={cn("p-2 rounded-lg", service.iconColor)}
                      >
                        <service.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedServices.length === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            // Step 2: Project Details
            <div className="space-y-6">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="pl-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">
                Tell us about your project
              </h1>

              <Card>
                <CardHeader>
                  <CardTitle>Selected Services</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {selectedServices.map((service) => (
                    <div
                      key={service.title}
                      className="flex items-center gap-2 bg-muted py-1 px-2 rounded-md"
                    >
                      <div
                        className={cn("p-1 rounded-sm", service.iconColor)}
                      >
                        <service.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {service.title}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., New Corporate Website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">
                      Project Description
                    </Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="Describe your project goals, target audience, and key features..."
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="briefAttachment">Project Brief</Label>
                    <Input id="briefAttachment" type="file" />
                    <p className="text-sm text-muted-foreground">
                      Attach any relevant documents for the project brief.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      placeholder="Any additional notes or specific instructions..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commentAttachment">Attach File</Label>
                    <Input id="commentAttachment" type="file" />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-2">
                <Button>Submit Request</Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicesPage;