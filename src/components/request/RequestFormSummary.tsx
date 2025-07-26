import { Button } from "@/components/ui/button";

interface RequestFormSummaryProps {
  onSubmit: () => void;
  isDisabled: boolean;
}

const RequestFormSummary = ({ onSubmit, isDisabled }: RequestFormSummaryProps) => {
  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-end gap-6 p-4">
        <Button onClick={onSubmit} disabled={isDisabled}>
          Submit Request
        </Button>
      </div>
    </div>
  );
};

export default RequestFormSummary;