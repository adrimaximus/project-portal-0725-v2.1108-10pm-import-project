import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmptyDashboard = () => {
  return (
    <Card className="w-full border-2 border-dashed bg-transparent shadow-none animate-in fade-in-0 duration-500">
      <CardHeader className="text-center">
        <div className="mx-auto bg-secondary rounded-full p-3 w-fit mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard text-muted-foreground"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        </div>
        <CardTitle className="text-2xl">Dashboard Anda Kosong</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">
          Sepertinya Anda belum membuat proyek apa pun. <br />
          Mulailah dengan membuat proyek pertama Anda.
        </p>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Proyek Baru
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyDashboard;