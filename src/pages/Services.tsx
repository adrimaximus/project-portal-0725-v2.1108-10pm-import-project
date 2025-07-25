import React, { useState } from "react";
import PortalSidebar from "@/components/PortalSidebar";
import PortalHeader from "@/components/PortalHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { services } from "@/data/services";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <PortalSidebar />
      <div className="flex flex-col">
        <PortalHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Project Support
            </h1>
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
              <Card className="w-full hover:bg-muted/50 transition-colors cursor-pointer">
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
                <Card key={service.title} className="hover:bg-muted/50 transition-colors cursor-pointer">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServicesPage;