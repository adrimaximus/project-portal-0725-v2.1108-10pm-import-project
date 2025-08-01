import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import ServiceSelector from "@/components/request/ServiceSelector";
import { Service } from "@/data/services";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const handleServiceToggle = (serviceToToggle: Service) => {
    setSelectedServices((currentServices) =>
      currentServices.some((service) => service.title === serviceToToggle.title)
        ? currentServices.filter((service) => service.title !== serviceToToggle.title)
        : [...currentServices, serviceToToggle]
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      {step === 1 && (
        <div className="space-y-4">
          <ServiceSelector selectedServices={selectedServices} onServiceToggle={handleServiceToggle} />
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={selectedServices.length === 0}>
              Next
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <ProjectDetailsForm selectedServices={selectedServices} onBack={handleBack} />
      )}
    </div>
  );
};

export default RequestPage;