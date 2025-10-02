import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import RequestForm from "@/components/request/RequestForm";
import RequestSuccess from "@/components/request/RequestSuccess";
import RequestSummary from "@/components/request/RequestSummary";
import { Card } from "@/components/ui/card";

const Request = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleNext = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    console.log("Submitting request:", formData);
    // In a real app, you'd send this to a server
    setStep(3);
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return <Card className="max-w-2xl mx-auto"><RequestForm onNext={handleNext} /></Card>;
      case 2:
        return <Card className="max-w-2xl mx-auto"><RequestSummary formData={formData} onBack={handleBack} onSubmit={handleSubmit} /></Card>;
      case 3:
        return <Card className="max-w-2xl mx-auto"><RequestSuccess onReset={() => setStep(1)} /></Card>;
      default:
        return <Card className="max-w-2xl mx-auto"><RequestForm onNext={handleNext} /></Card>;
    }
  };

  const summaryComponent = (
    <div className="flex items-center gap-4">
      <h1 className="text-xl font-semibold">Submit a Request</h1>
      <div className="text-sm text-muted-foreground">Step {step} of 3</div>
    </div>
  );

  return (
    <PortalLayout summary={summaryComponent}>
      {renderContent()}
    </PortalLayout>
  );
};

export default Request;