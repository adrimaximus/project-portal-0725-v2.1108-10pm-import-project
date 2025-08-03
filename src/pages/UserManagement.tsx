import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { UserTable } from '@/components/users/UserTable';
import { InviteModal } from '@/components/users/InviteModal';
import { users as mockUsers } from '@/data/users';
import { RelatedContacts } from '@/components/users/RelatedContacts';

const UserManagementPage = () => {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Team members</h1>
                <p className="text-muted-foreground">
                    Manage your team members and their roles.
                </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Search by name or email..." 
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setInviteModalOpen(true)} className="whitespace-nowrap">
                    <Plus className="h-4 w-4 mr-2" />
                    Add member
                </Button>
            </div>
        </div>
        
        <UserTable users={filteredUsers} />

        <RelatedContacts />

        <InviteModal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} />
      </div>
    </PortalLayout>
  );
};

export default UserManagementPage;