import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, CalendarIcon, CreditCard, FileText, User, Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { useState } from "react";

interface InvoiceDetailsDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (invoiceId: string, newStatus: any) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ').filter(Boolean);
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return names[0]?.charAt(0).toUpperCase() || '';
};

const InvoiceDetailsDialog = ({ invoice, open, onOpenChange, onStatusChange }: InvoiceDetailsDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type?: string } | null>(null);

  if (!invoice) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (file: any) => {
    if (file.file_type === 'application/pdf' || file.file_type?.startsWith('image/')) {
        setPreviewFile({ 
            url: file.file_url, 
            name: file.file_name, 
            type: file.file_type 
        });
    } else {
        window.open(file.file_url, '_blank');
    }
  };

  const content = (
    <div className="grid gap-6 py-4 w-full">
      {/* Header Info */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <PaymentStatusBadge 
                    status={invoice.status} 
                    onStatusChange={onStatusChange ? (newStatus) => onStatusChange(invoice.rawProjectId, newStatus) : undefined} 
                />
            </div>
            <div className="space-y-1 text-left sm:text-right">
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{format(new Date(invoice.dueDate), "PPP")}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Financials */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">PO Number</p>
              <p className="font-medium font-mono">{invoice.poNumber || '-'}</p>
            </div>
          </div>
        </div>

        {/* Entities */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={invoice.clientAvatarUrl || invoice.clientLogo || undefined} alt={invoice.clientName || ''} />
                    <AvatarFallback className="text-[10px]">{getInitials(invoice.clientName)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium leading-none">{invoice.clientName || 'N/A'}</p>
                    {invoice.clientCompanyName && <p className="text-xs text-muted-foreground mt-0.5">{invoice.clientCompanyName}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Project Owner</p>
              {invoice.projectOwner ? (
                  <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={invoice.projectOwner.avatar_url} />
                      <AvatarFallback className="text-[10px]">
                      {invoice.projectOwner.initials}
                      </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{invoice.projectOwner.name}</span>
                  </div>
              ) : (
                  <p className="text-sm font-medium">-</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attachments */}
      {invoice.invoiceAttachments && invoice.invoiceAttachments.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <h4 className="font-semibold text-sm">Attachments ({invoice.invoiceAttachments.length})</h4>
            </div>
            <div className="space-y-2 w-full">
              {invoice.invoiceAttachments.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/40 w-full">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-all truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(file)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.file_url, file.file_name)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const Title = isDesktop ? DialogTitle : DrawerTitle;
  const Description = isDesktop ? DialogDescription : DrawerDescription;

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="pr-8">
                <Title className="text-xl break-all">{invoice.id}</Title>
                <Description className="mt-1 font-medium text-primary">
                  {invoice.projectName}
                </Description>
              </div>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[95vh] flex flex-col">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="pr-4">
                <Title className="text-xl break-all">{invoice.id}</Title>
                <Description className="mt-1 font-medium text-primary">
                  {invoice.projectName}
                </Description>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* File Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="w-full h-[100dvh] max-w-full rounded-none border-0 p-0 flex flex-col sm:h-[80vh] sm:max-w-4xl sm:rounded-lg sm:border">
          <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0 bg-background">
            <DialogTitle className="truncate pr-4 text-base">{previewFile?.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="-mr-2 sm:mr-0">
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center p-4">
             {previewFile?.type === 'application/pdf' ? (
                 <iframe 
                    src={`${previewFile.url}#view=FitH`} 
                    title={previewFile.name}
                    className="w-full h-full border-none rounded-md" 
                 />
             ) : (
                 <img 
                    src={previewFile?.url} 
                    alt={previewFile?.name} 
                    className="max-w-full max-h-full object-contain rounded-md shadow-sm" 
                 />
             )}
          </div>
          <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0 bg-background">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.open(previewFile?.url, '_blank')}>
                Open Original
            </Button>
            {isDesktop && <Button onClick={() => setPreviewFile(null)}>Close</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDetailsDialog;