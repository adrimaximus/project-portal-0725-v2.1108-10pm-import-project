import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Building } from "lucide-react";

interface BeneficiaryTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: 'person' | 'company') => void;
}

const BeneficiaryTypeDialog = ({ open, onOpenChange, onSelect }: BeneficiaryTypeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>New Beneficiary</DialogTitle>
          <DialogDescription>
            What type of beneficiary are you creating?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-around pt-4">
          <Button variant="outline" className="flex flex-col h-24 w-24" onClick={() => onSelect('person')}>
            <User className="h-8 w-8 mb-2" />
            Person
          </Button>
          <Button variant="outline" className="flex flex-col h-24 w-24" onClick={() => onSelect('company')}>
            <Building className="h-8 w-8 mb-2" />
            Company
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiaryTypeDialog;