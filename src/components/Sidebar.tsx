import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import * as Icons from 'lucide-react';
import { cn } from "@/lib/utils";
import React from "react";

// Helper untuk merender ikon secara dinamis berdasarkan nama
const Icon = ({ name, ...props }: { name: string } & React.ComponentProps<typeof Icons.Folder>) => {
  const LucideIcon = Icons[name as keyof typeof Icons] as React.ElementType;
  if (!LucideIcon) {
    return <Icons.Folder {...props} />; // Ikon fallback
  }
  return <LucideIcon {...props} />;
};

// Helper untuk mengubah URL item navigasi menjadi ID izin yang sesuai
const urlToPermissionId = (url: string): string | null => {
    const path = url.split('?')[0];
    // Jalur ini tidak memerlukan izin modul khusus
    if (['/dashboard', '/settings', '/profile'].includes(path)) {
        return null;
    }
    // Mengubah '/knowledge-base' menjadi 'module:knowledge-base'
    const moduleName = path.substring(1);
    return `module:${moduleName}`;
}

const Sidebar = () => {
    const { user, hasPermission } = useAuth();

    const { data: navItems, isLoading } = useQuery({
        queryKey: ['user_navigation_items', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.rpc('get_user_navigation_items');
            if (error) throw new Error(error.message);
            return data || [];
        },
        enabled: !!user,
    });

    const visibleNavItems = navItems
        ?.filter(item => {
            const permissionId = urlToPermissionId(item.url);
            // Jika tidak ada izin yang diperlukan, tampilkan item.
            // Jika tidak, periksa apakah pengguna memiliki izin.
            return permissionId ? hasPermission(permissionId) : true;
        })
        .sort((a, b) => a.position - b.position);

    if (isLoading) {
        return <div className="hidden lg:flex flex-col w-64 bg-gray-50 border-r p-4">Memuat Navigasi...</div>;
    }

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-gray-50 border-r">
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold text-gray-800">Ahensi</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {visibleNavItems?.map(item => (
                    <NavLink
                        key={item.id}
                        to={item.url}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-gray-200 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )
                        }
                    >
                        <Icon name={item.icon || 'Folder'} className="mr-3 h-5 w-5" />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;