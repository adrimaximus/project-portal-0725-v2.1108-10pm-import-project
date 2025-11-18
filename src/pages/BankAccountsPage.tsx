import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Building, User } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import BankAccountFormDialog from '@/components/billing/BankAccountFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BankAccount } from '@/types';

const BankAccountsPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['allBankAccounts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_bank_accounts');
      if (error) throw error;
      return data as BankAccount[];
    }
  });

  const handleEdit = (account: BankAccount) => {
    setAccountToEdit(account);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    const { error } = await supabase.from('bank_accounts').delete().eq('id', accountToDelete.id);
    if (error) {
      toast.error(`Failed to delete account: ${error.message}`);
    } else {
      toast.success(`Account for ${accountToDelete.account_name} deleted.`);
      queryClient.invalidateQueries({ queryKey: ['allBankAccounts'] });
    }
    setAccountToDelete(null);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Bank Accounts</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage all beneficiary bank accounts in one place.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
            <CardDescription>A list of all saved bank accounts for your contacts and companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading accounts...</TableCell></TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No bank accounts found.</TableCell></TableRow>
                ) : accounts.map(account => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Link 
                        to={account.owner_type === 'person' ? `/people/${account.owner_slug}` : `/companies/${account.owner_slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(account.owner_avatar_url, account.owner_id)} />
                          <AvatarFallback style={generatePastelColor(account.owner_id)}>
                            {account.owner_type === 'person' ? <User className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium group-hover:underline">{account.owner_name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{account.bank_name}</TableCell>
                    <TableCell>{account.account_name}</TableCell>
                    <TableCell>{account.account_number}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEdit(account)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setAccountToDelete(account)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <BankAccountFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['allBankAccounts'] })}
        account={accountToEdit}
      />

      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bank account for {accountToDelete?.account_name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default BankAccountsPage;