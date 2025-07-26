"use client";

import { type Service } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedServicesSummaryProps {
  selectedServices: Service[];
  onServiceRemove: (service: Service) => void;
  onStepChange: (step: number) => void;
}

export default function SelectedServicesSummary({
  selectedServices,
  onServiceRemove,
  onStepChange,
}: SelectedServicesSummaryProps) {
  if (selectedServices.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>No Services Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please go back and select at least one service.
          </p>
          <Button onClick={() => onStepChange(0)} className="mt-4">
            Select Services
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Services</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {selectedServices.map((service) => (
            <li
              key={service.name}
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <div className="flex items-center gap-3">
                <service.icon className={cn("h-5 w-5", service.color)} />
                <span className="font-medium">{service.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onServiceRemove(service)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}