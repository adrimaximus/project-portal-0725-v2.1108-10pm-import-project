import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Service } from "@/data/services";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import { Stepper, StepperItem, StepperSeparator } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const RequestPage = () => {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [step, setStep] = useState(1);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleNext = () => {
    if (selectedServices.length > 0) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (values: any) => {
    console.log({ ...values, services: selectedServices.map(s => s.title) });
    alert("Request submitted! Check the console for details.");
    setStep(1);
    setSelectedServices([]);
  };

  return (
    <PortalLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Request a New Project</h1>
        <p className="text-muted-foreground mb-8">Fill out the form below to get started.</p>

        <Stepper className="mb-12">
          <StepperItem isCurrent={step === 1} isCompleted={step > 1}>
            Select Services
          </StepperItem>
          <StepperSeparator />
          <StepperItem isCurrent={step === 2} isCompleted={false}>
            Project Details
          </StepperItem>
        </Stepper>

        <div className="relative">
            {step === 1 && (
                <div>
                    <ServiceSelection
                        selectedServices={selectedServices}
                        onServiceToggle={handleServiceToggle}
                    />
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleNext} disabled={selectedServices.length === 0}>
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <Button variant="ghost" onClick={handleBack} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to services
                    </Button>
                    <ProjectDetailsForm
                        selectedServices={selectedServices}
                        onSubmit={handleSubmit}
                    />
                </div>
            )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default RequestPage;