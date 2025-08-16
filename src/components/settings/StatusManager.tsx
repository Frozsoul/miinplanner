
"use client";

import { useState } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Plus, Trash2, Loader2 } from "lucide-react";

export function StatusManager() {
  const { taskStatuses, addStatus, deleteStatus, isLoadingAppData } = useAppData();
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStatus = async () => {
    if (!newStatus.trim()) {
      toast({ title: "Error", description: "Status name cannot be empty.", variant: "destructive" });
      return;
    }
    if (taskStatuses.some(s => s.toLowerCase() === newStatus.trim().toLowerCase())) {
        toast({ title: "Error", description: "This status already exists.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    await addStatus(newStatus.trim());
    setNewStatus("");
    setIsSubmitting(false);
  };

  const handleDeleteStatus = async (statusToDelete: string) => {
    setIsSubmitting(true);
    await deleteStatus(statusToDelete);
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListTodo />Custom Task Statuses</CardTitle>
        <CardDescription>
          Define the stages of your workflow. Add or remove statuses as needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
            {isLoadingAppData && <Loader2 className="h-5 w-5 animate-spin" />}
            {!isLoadingAppData && taskStatuses.map(status => (
                <div key={status} className="flex items-center bg-muted rounded-full">
                    <Badge variant="secondary" className="text-sm rounded-r-none">{status}</Badge>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-full"
                        onClick={() => handleDeleteStatus(status)}
                        disabled={isSubmitting}
                        aria-label={`Delete status ${status}`}
                    >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Input 
            placeholder="Enter new status name..."
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddStatus()}}
          />
          <Button onClick={handleAddStatus} disabled={isSubmitting || !newStatus.trim()}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">Add</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
