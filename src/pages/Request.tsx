"use client";

import React, { useState } from "react";
import { Stepper, Step, StepLabel, StepContent } from "@/components/ui/stepper";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import { type Service } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RequestPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.name === service.name)
        ? prev.filter((s) => s.name !== service.name)
        : [...prev, service]
    );
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedServices.length === 0) {
      toast({
        title: "No services selected",
        description: "Please select at least one service to proceed.",
        variant: "destructive",
      });
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = (values: any) => {
    console.log("Form Submitted:", {
      ...values,
      services: selectedServices.map(s => s.name),
    });
    setIsSubmitted(true);
    toast({
      title: "Request Submitted!",
      description: "Thank you! We will get back to you shortly.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="mt-4">Request Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We have received your project request and will be in touch with you soon.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-6">
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Submit a New Project Request</h1>
      <p className="text-muted-foreground text-center mb-8">
        Follow the steps below to get a quote for your project.
      </p>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step>
          <StepLabel>Select Services</StepLabel>
          <StepContent>
            <ServiceSelection
              selectedServices={selectedServices}
              onServiceToggle={handleServiceToggle}
            />
          </StepContent>
        </Step>
        <Step>
          <StepLabel>Provide Details</StepLabel>
          <StepContent>
            <ProjectDetailsForm
              selectedServices={selectedServices}
              onSubmit={handleSubmit}
            />
          </StepContent>
        </Step>
      </Stepper>
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>
        {activeStep === 0 ? (
          <Button onClick={handleNext}>
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}