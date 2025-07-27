"use client";

import { useState } from "react";
import { Stepper, StepperItem, StepperSeparator } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import ServiceSelectionForm from "@/components/request/ServiceSelectionForm";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import RequestSummary from "@/components/request/RequestSummary";
import { allUsers, Project } from "@/data/projects";
import { services, Service } from "@/data/services";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const steps = [
  { id: 1, label: "Select Services" },
  { id: 2, label: "Project Details" },
  { id: 3, label: "Summary & Submit" },
];

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const router = useRouter();
  const { toast } = useToast();

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Submitting request:", { selectedServices, formData });
    toast({
      title: "Request Submitted!",
      description: "Your project request has been successfully submitted.",
    });
    router.push("/projects");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ServiceSelectionForm
            services={services}
            selectedServices={selectedServices}
            onSelectionChange={setSelectedServices}
          />
        );
      case 2:
        return (
          <ProjectDetailsForm
            formData={formData}
            handleInputChange={handleInputChange}
            allUsers={allUsers}
          />
        );
      case 3:
        return (
          <RequestSummary
            selectedServices={selectedServices}
            projectDetails={formData}
            onBack={() => setStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-center mb-4">
        New Project Request
      </h1>
      <p className="text-center text-muted-foreground mb-12">
        Fill out the form below to get started with your new project.
      </p>

      <Stepper>
        {steps.map((s, index) => (
          <>
            <StepperItem
              key={s.id}
              isActive={step === s.id}
              isCompleted={step > s.id}
            >
              {s.label}
            </StepperItem>
            {index < steps.length - 1 && <StepperSeparator />}
          </>
        ))}
      </Stepper>

      <div className="mt-12">{renderStep()}</div>

      <div className="mt-12 flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        {step < steps.length ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>Submit Request</Button>
        )}
      </div>
    </div>
  );
};

export default RequestPage;