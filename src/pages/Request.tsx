import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SelectedServicesSummary from "@/components/SelectedServicesSummary";
import ServiceSelection, { Service } from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const handleServiceSelect = (service: Service) => {
    const isFeatured = service.is_featured;
    const isAlreadySelected = selectedServices.some(
      (s) => s.id === service.id
    );

    if (isFeatured) {
      setSelectedServices(isAlreadySelected ? [] : [service]);
    } else {
      // Filter out any featured services first
      let newSelectedServices = selectedServices.filter(
        (s) => !s.is_featured
      );
      if (isAlreadySelected) {
        // If it's already selected, remove it
        newSelectedServices = newSelectedServices.filter(
          (s) => s.id !== service.id
        );
      } else {
        // If it's not selected, add it
        newSelectedServices.push(service);
      }
      setSelectedServices(newSelectedServices);
    }
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <ServiceSelection
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedServices={selectedServices}
          onServiceSelect={handleServiceSelect}
        />
      );
    } else {
      return (
        <ProjectDetailsForm
          selectedServices={selectedServices}
          onBack={() => setStep(1)}
        />
      );
    }
  };

  const summaryComponent =
    step === 1 ? (
      <SelectedServicesSummary
        selectedServices={selectedServices}
        onContinue={() => setStep(2)}
      />
    ) : null;

  return (
    <PortalLayout summary={summaryComponent} disableMainScroll={step === 2}>
      {renderContent()}
    </PortalLayout>
  );
};

export default RequestPage;