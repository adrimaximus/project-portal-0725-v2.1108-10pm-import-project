import { useState } from "react";
import ServiceSelector from "@/components/request/ServiceSelector";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import { Service, services } from "@/data/services";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const handleNext = (services: Service[]) => {
    setSelectedServices(services);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {step === 1 && (
        <ServiceSelector
          services={services}
          onNext={handleNext}
        />
      )}
      {step === 2 && (
        <ProjectDetailsForm
          selectedServices={selectedServices}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default RequestPage;