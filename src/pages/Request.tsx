import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Service } from "@/types";
import SelectedServicesSummary from "@/components/SelectedServicesSummary";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const handleServiceSelect = (service: Service) => {
    const isEndToEnd = service.title === 'End-to-End Services';
    const isAlreadySelected = selectedServices.some((s) => s.id === service.id);
    const isEndToEndCurrentlySelected = selectedServices.some(
      (s) => s.title === 'End-to-End Services'
    );

    if (isAlreadySelected) {
      // Jika layanan yang diklik sudah dipilih, batalkan pilihan.
      setSelectedServices((prev) => prev.filter((s) => s.id !== service.id));
    } else {
      // Jika layanan yang diklik belum dipilih.
      if (isEndToEnd) {
        // Jika pengguna mengklik "End-to-End", pilih hanya itu.
        setSelectedServices([service]);
      } else {
        // Jika pengguna mengklik layanan lain
        if (isEndToEndCurrentlySelected) {
          // dan "End-to-End" sedang dipilih, ganti dengan layanan baru.
          setSelectedServices([service]);
        } else {
          // dan "End-to-End" tidak dipilih, tambahkan layanan baru ke daftar.
          setSelectedServices((prev) => [...prev, service]);
        }
      }
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