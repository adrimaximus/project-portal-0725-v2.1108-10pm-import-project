import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import PortalLayout from "@/components/PortalLayout";
import { Service } from "@/data/services";
import { dummyProjects, Project, AssignedUser } from "@/data/projects";
import SelectedServicesSummary from "@/components/SelectedServicesSummary";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import RequestFormSummary from "@/components/request/RequestFormSummary";

const RequestPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // State for ServiceSelection
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // State for ProjectDetailsForm
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [paymentDueDate, setPaymentDueDate] = useState<Date>();
  const [budget, setBudget] = useState<number | undefined>();
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [assignedTeam, setAssignedTeam] = useState<AssignedUser[]>([]);

  const handleServiceSelect = (service: Service) => {
    const isFeatured = service.title === "End to End Services";
    const isAlreadySelected = selectedServices.some(
      (s) => s.title === service.title
    );

    if (isFeatured) {
      setSelectedServices(isAlreadySelected ? [] : [service]);
    } else {
      let newSelectedServices = selectedServices.filter(
        (s) => s.title !== "End to End Services"
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

  const isSubmitDisabled = !projectName || !projectDescription || selectedServices.length === 0 || !startDate || !endDate || !budget || assignedTeam.length === 0;

  const handleSubmitRequest = () => {
    if (isSubmitDisabled) {
      alert("Please fill all required fields.");
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
      status: "Requested",
      progress: 0,
      startDate: format(startDate as Date, "yyyy-MM-dd"),
      deadline: format(endDate as Date, "yyyy-MM-dd"),
      paymentDueDate: paymentDueDate ? format(paymentDueDate, "yyyy-MM-dd") : undefined,
      budget: budget as number,
      paymentStatus: "pending",
      assignedTo: assignedTeam,
      services: selectedServices.map(s => s.title),
      briefFiles: briefFiles,
    };

    dummyProjects.unshift(newProject);
    navigate(`/projects/${newProject.id}`);
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
          projectName={projectName}
          setProjectName={setProjectName}
          projectDescription={projectDescription}
          setProjectDescription={setProjectDescription}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          paymentDueDate={paymentDueDate}
          setPaymentDueDate={setPaymentDueDate}
          budget={budget}
          setBudget={setBudget}
          briefFiles={briefFiles}
          setBriefFiles={setBriefFiles}
          assignedTeam={assignedTeam}
          setAssignedTeam={setAssignedTeam}
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
    ) : (
      <RequestFormSummary
        onSubmit={handleSubmitRequest}
        isDisabled={isSubmitDisabled}
      />
    );

  return (
    <PortalLayout summary={summaryComponent}>
      {renderContent()}
    </PortalLayout>
  );
};

export default RequestPage;