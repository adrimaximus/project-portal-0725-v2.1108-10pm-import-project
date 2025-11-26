import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Service } from "@/types";
import SelectedServicesSummary from "@/components/SelectedServicesSummary";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import { useSearchParams } from "react-router-dom";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [searchParams] = useSearchParams();
  const servicesParam = searchParams.get('services');

  const handleServiceSelect = (service: Service) => {
    // Logic for "End to End" exclusivity
    const isEndToEnd = service.title.toLowerCase().includes('end to end');
    
    setSelectedServices(prev => {
      const isAlreadySelected = prev.some(s => s.id === service.id);

      if (isAlreadySelected) {
        return prev.filter(s => s.id !== service.id);
      }

      // If selecting End to End, clear all others
      if (isEndToEnd) {
        return [service];
      }

      // If selecting normal service, remove any existing End to End service
      const filtered = prev.filter(s => !s.title.toLowerCase().includes('end to end'));
      return [...filtered, service];
    });
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <ServiceSelection
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedServices={selectedServices}
          onServiceSelect={handleServiceSelect}
          preSelectIds={servicesParam}
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