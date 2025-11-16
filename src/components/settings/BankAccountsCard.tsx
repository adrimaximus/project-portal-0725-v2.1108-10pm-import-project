import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Landmark } from "lucide-react";

const BankAccountsCard = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/settings/bank-accounts');
  };

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Bank Accounts
        </CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Manage beneficiary bank accounts for expenses.
        </p>
      </CardContent>
    </Card>
  );
};

export default BankAccountsCard;