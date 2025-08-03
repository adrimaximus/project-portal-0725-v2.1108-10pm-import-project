"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelLeft, Plus, Trash2 } from "lucide-react";

export interface NavItem {
  id: string;
  name: string;
  url: string;
}

const STORAGE_KEY = 'customNavItems';

const NavigationCard = () => {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");

  useEffect(() => {
    try {
      const items = localStorage.getItem(STORAGE_KEY);
      if (items) {
        setNavItems(JSON.parse(items));
      }
    } catch (error) {
      console.error("Failed to parse nav items from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(navItems));
    } catch (error) {
      console.error("Failed to save nav items to localStorage", error);
    }
  }, [navItems]);

  const handleAddItem = () => {
    if (newItemName.trim() && newItemUrl.trim()) {
      try {
        new URL(newItemUrl);
      } catch (_) {
        // Silently fail on invalid URL, button is disabled anyway for empty url
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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-md">
                  <PanelLeft className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Navigation</CardTitle>
                  <CardDescription>
                    Add custom pages to your sidebar menu.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Customize Navigation</DialogTitle>
            <DialogDescription>
              Add or remove custom pages from your sidebar. The sidebar will update on the next page refresh.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {navItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No custom items yet.</p>}
              {navItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="truncate">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <hr className="my-2" />
            <div className="space-y-4">
                <h4 className="font-medium text-center">Add New Item</h4>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Analytics Dashboard" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="https://example.com/dashboard" />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || !newItemUrl.trim()}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NavigationCard;