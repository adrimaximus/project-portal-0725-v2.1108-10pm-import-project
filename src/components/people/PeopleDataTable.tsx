import React, { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Person } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PeopleDataTableProps {
  data: Person[];
  columns: ColumnDef<Person>[];
}

export const PeopleDataTable = ({ data, columns }: PeopleDataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const queryClient = useQueryClient();
  const [newData, setNewData] = useState<Partial<Person>>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    meta: {
      updateData: async (rowIndex: number, columnId: string, value: any) => {
        const person = data[rowIndex];
        const { error } = await supabase
          .from('people')
          .update({ [columnId]: value, updated_at: new Date().toISOString() })
          .eq('id', person.id);
        
        if (error) {
          toast.error(`Failed to update ${columnId}.`);
        } else {
          toast.success(`${person.full_name}'s ${columnId.replace(/_/g, ' ')} updated.`);
          queryClient.invalidateQueries({ queryKey: ['people'] });
        }
      },
    },
  });

  const handleAddNewPerson = async () => {
    if (!newData.full_name) {
      toast.error("Full name is required to add a new person.");
      return;
    }
    const { error } = await supabase.from('people').insert([newData]);
    if (error) {
      toast.error("Failed to add new person.");
    } else {
      toast.success(`${newData.full_name} added successfully.`);
      setNewData({});
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {/* New Person Row */}
          <TableRow>
            {table.getAllColumns().map(column => (
              <TableCell key={column.id} className="p-1">
                <Input
                  placeholder={column.id === 'full_name' ? 'Enter Name...' : ''}
                  value={(newData[column.id as keyof Person] as string) || ''}
                  onChange={(e) => setNewData(prev => ({ ...prev, [column.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewPerson();
                    }
                  }}
                  className="border-none focus-visible:ring-1"
                />
              </TableCell>
            ))}
          </TableRow>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};