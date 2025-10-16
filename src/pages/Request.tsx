import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Service } from "@/components/request/ServiceSelection";
import SelectedServicesSummary from "@/components/SelectedServicesSummary";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import PeopleFormDialog from "@/components/people/PeopleFormDialog";
import { Person } from "@/types";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [selectedClient, setSelectedClient] = useState<{ type: 'person' | 'company', data: Person | any } | null>(null);

  const handleServiceSelect = (service: Service) => {
    const isFeatured = service.is_featured;
    const isAlreadySelected = selectedServices.some(
      (s) => s.title === service.title
    );

    if (isFeatured) {
      setSelectedServices(isAlreadySelected ? [] : [service]);
    } else {
      let newSelectedServices = selectedServices.filter(
        (s) => !s.is_featured
      );
      if (isAlreadySelected) {
        newSelectedServices = newSelectedServices.filter(
          (s) => s.title !== service.title
        );
      } else {
        newSelectedServices.push(service);
      }
      setSelectedServices(newSelectedServices);
    }
  };

  const handlePersonCreated = (newPerson: Person) => {
    setAllPeople(prev => [...prev, newPerson]);
    setSelectedClient({ type: 'person', data: newPerson });
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
        <>
          <ProjectDetailsForm
            selectedServices={selectedServices}
            onBack={() => setStep(1)}
            allPeople={allPeople}
            setAllPeople={setAllPeople}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            onAddNewClient={() => setIsPersonFormOpen(true)}
          />
          <PeopleFormDialog
            open={isPersonFormOpen}
            onOpenChange={setIsPersonFormOpen}
            onSuccess={handlePersonCreated}
            person={null}
          />
        </>
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