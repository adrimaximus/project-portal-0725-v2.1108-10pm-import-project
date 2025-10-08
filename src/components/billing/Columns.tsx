import { ColumnDef } from "@tanstack/react-table";
import { Invoice, User } from "@/types";

interface GetColumnsProps {
  onUpdate: (invoiceId: string, updates: Partial<Invoice>) => void;
  currentUser: User | null;
}

export const getColumns = ({ onUpdate, currentUser }: GetColumnsProps): ColumnDef<Invoice>[] => {
  return [
    {
      accessorKey: "projectName",
      header: "Project",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      }
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <div>{new Date(row.getValue("dueDate")).toLocaleDateString()}</div>
      )
    },
  ];
};