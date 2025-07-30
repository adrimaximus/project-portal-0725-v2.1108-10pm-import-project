"use client";

import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const Request = () => {
  const [category, setCategory] = useState("");

  const summary = (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>Submit Request</Button>
      </div>
    </div>
  );

  return (
    <PortalLayout summary={summary}>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Request</h1>
          <p className="text-muted-foreground">
            Fill in the details below to submit a new request.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
            <CardDescription>
              Provide a clear title and description for your request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., Need access to new software" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technical Support</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide all necessary details..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Your request will be reviewed by an administrator.
            </p>
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Request;