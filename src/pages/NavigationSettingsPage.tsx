import React, { useState, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface NavItem {
  id: string;
  name: string;
  url: string;
}

const SortableNavItemRow = ({ item, onDelete }: { item: NavItem, onDelete: (id: string) => void }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 10 : 0,
      position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md bg-background">
            <div className="flex items-center gap-2 truncate">
                <button {...attributes} {...listeners} className="cursor-grab p-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="truncate">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

const NavigationSettingsPage = () => {
  const { user } = useAuth();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const localStorageKey = user ? `customNavItems_${user.id}` : '';

  useEffect(() => {
    if (!localStorageKey) return;
    try {
      const items = localStorage.getItem(localStorageKey);
      if (items) {
        setNavItems(JSON.parse(items));
      }
    } catch (error) {
      console.error("Failed to parse nav items from localStorage", error);
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (!localStorageKey) return;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(navItems));
    } catch (error) {
      console.error("Failed to save nav items to localStorage", error);
    }
  }, [navItems, localStorageKey]);

  const handleAddItem = () => {
    if (newItemName.trim() && newItemUrl.trim()) {
      try {
        new URL(newItemUrl);
      } catch (_) {
        return;
      }
      
      setNavItems([
        ...navItems,
        { id: crypto.randomUUID(), name: newItemName.trim(), url: newItemUrl.trim() },
      ]);
      setNewItemName("");
      setNewItemUrl("");
    }
  };

  const handleDeleteItem = (id: string) => {
    setNavItems(navItems.filter((item) => item.id !== id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setNavItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Navigation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Customize Navigation
          </h1>
          <p className="text-muted-foreground">
            Add or remove custom pages from your sidebar. The sidebar will update on the next page refresh.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Custom Navigation Items</CardTitle>
            <CardDescription>Drag and drop to reorder items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {navItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No custom items yet.</p>}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={navItems} strategy={verticalListSortingStrategy}>
                    {navItems.map((item) => (
                        <SortableNavItemRow key={item.id} item={item} onDelete={handleDeleteItem} />
                    ))}
                </SortableContext>
              </DndContext>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="https://example.com/dashboard" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || !newItemUrl.trim()}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default NavigationSettingsPage;