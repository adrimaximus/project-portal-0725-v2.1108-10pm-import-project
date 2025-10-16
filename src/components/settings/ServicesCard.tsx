import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServicesManager from './ServicesManager';

const ServicesCard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card onClick={() => setIsOpen(true)} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Services</CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage the services offered on the request page.
          </p>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Services</DialogTitle>
          </DialogHeader>
          <ServicesManager />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServicesCard;