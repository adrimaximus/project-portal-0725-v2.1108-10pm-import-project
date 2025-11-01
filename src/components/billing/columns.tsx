"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Invoice, PaymentStatus } from "@/types"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { Badge } from "@/components/ui/badge"
import { cn, getPaymentStatusStyles } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import PaymentStatusBadge from "./PaymentStatusBadge"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

const handleStatusChange = async (invoiceId: string, newStatus: PaymentStatus, refetch: () => void) => {
  const updatePayload: { payment_status: PaymentStatus, payment_due_date?: null } = { payment_status: newStatus };
  
  if (newStatus === 'Proposed') {
    updatePayload.payment_due_date = null;
  }

  const { error } = await supabase
    .from('split_invoices')
    .update(updatePayload)
    .eq('id', invoiceId);

  if (error) {
    toast.error(`Failed to update status: ${error.message}`);
  } else {
    toast.success("Payment status updated successfully.");
    refetch();
  }
};

export const getColumns = (refetch: () => void): ColumnDef<Invoice>[] => [
  {
    accessorKey: "project_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.project_name}</span>
          <span className="text-sm text-muted-foreground">{row.original.client_company_name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "payment_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const dueDate = row.original.payment_due_date ? parseISO(row.original.payment_due_date) : null;
      const isOverdue = dueDate && dueDate < new Date() && row.original.payment_status !== 'Paid' && row.original.payment_status !== 'Cancelled';
      const status: PaymentStatus = isOverdue ? 'Overdue' : row.original.payment_status;

      return (
        <PaymentStatusBadge 
          status={status} 
          onStatusChange={(newStatus) => handleStatusChange(row.original.id, newStatus, refetch)} 
        />
      );
    },
  },
  {
    accessorKey: "payment_due_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("payment_due_date")
      return date ? <span>{format(parseISO(date as string), "MMM d, yyyy")}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "invoice_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice #" />
    ),
    cell: ({ row }) => {
      return <span>{row.original.invoice_number || '-'}</span>
    },
  },
]