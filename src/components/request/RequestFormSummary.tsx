import { Button } from "@/components/ui/button";

interface RequestFormSummaryProps {
  onSubmit: () => void;
  isDisabled: boolean;
}

const RequestFormSummary = ({ onSubmit, isDisabled }: RequestFormSummaryProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm md:left-[220px] lg:left-[280px] z-10">
      <div className="flex items-center justify-end gap-6 p-4">
        <Button onClick={onSubmit} disabled={isDisabled}>
          Submit Request
        </Button>
      </div>
    </div>
  );
};

export default RequestFormSummary;