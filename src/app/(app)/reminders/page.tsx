
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Reminder, ReminderData } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { addReminder, deleteReminder, getReminders } from "@/services/reminder-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/tasks/date-picker";
import { PlusCircle, Trash2, BellRing, Loader2 } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ReminderItem = ({ reminder, onDelete }: { reminder: Reminder; onDelete: (id: string) => void; }) => {
  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><BellRing className="h-5 w-5 text-accent" /> {reminder.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)} aria-label="Delete reminder"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {isValid(parseISO(reminder.remindAt)) && 
          <p className="text-sm text-muted-foreground">Remind on: {format(parseISO(reminder.remindAt), "PPPp")}</p>
        }
      </CardContent>
    </Card>
  );
};

export default function RemindersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newReminderForm, setNewReminderForm] = useState<{ title: string; remindAt?: Date }>({ title: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchUserReminders = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingReminders(true);
      try {
        const userReminders = await getReminders(user.uid);
        setReminders(userReminders);
      } catch (error) {
        console.error("Failed to fetch reminders:", error);
        toast({ title: "Error", description: "Could not fetch reminders.", variant: "destructive" });
      } finally {
        setIsLoadingReminders(false);
      }
    } else {
      setReminders([]);
      setIsLoadingReminders(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchUserReminders();
  }, [fetchUserReminders]);

  const resetForm = () => {
    setNewReminderForm({ title: "", remindAt: undefined });
  };

  const handleAddReminder = async () => {
    if (!user?.uid || newReminderForm.title.trim() === "" || !newReminderForm.remindAt) {
      toast({ title: "Validation Error", description: "Title and remind date are required.", variant: "destructive"});
      return;
    }
    
    setIsSubmitting(true);
    const reminderToAdd: ReminderData = { 
      title: newReminderForm.title,
      remindAt: newReminderForm.remindAt.toISOString(), 
    };

    try {
      await addReminder(user.uid, reminderToAdd);
      fetchUserReminders(); // Refresh list
      resetForm();
      setIsFormOpen(false);
      toast({ title: "Success", description: "Reminder added." });
    } catch (error) {
      console.error("Failed to add reminder:", error);
      toast({ title: "Error", description: "Could not add reminder.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!user?.uid) return;
    setIsSubmitting(true);
    try {
      await deleteReminder(user.uid, id);
      setReminders(prevReminders => prevReminders.filter(reminder => reminder.id !== id));
      toast({ title: "Success", description: "Reminder deleted." });
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      toast({ title: "Error", description: "Could not delete reminder.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const sortedReminders = [...reminders].sort((a, b) => {
    const dateA = parseISO(a.remindAt).getTime();
    const dateB = parseISO(b.remindAt).getTime();
    return dateA - dateB;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Reminders</h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) resetForm();}}>
          <DialogTrigger asChild>
            <Button onClick={() => {resetForm(); setIsFormOpen(true);}} className="flex items-center gap-2" disabled={!user}>
              <PlusCircle className="h-5 w-5" /> Add New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Reminder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  value={newReminderForm.title} 
                  onChange={e => setNewReminderForm({ ...newReminderForm, title: e.target.value })} 
                  className="col-span-3" placeholder="Reminder title" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="remindAt" className="text-right">Remind At</Label>
                <DatePicker 
                  date={newReminderForm.remindAt} 
                  setDate={(date) => setNewReminderForm({ ...newReminderForm, remindAt: date })} 
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild><Button variant="outline" onClick={resetForm}>Cancel</Button></DialogClose>
              <Button onClick={handleAddReminder} disabled={isSubmitting || !newReminderForm.title || !newReminderForm.remindAt}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Reminder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingReminders && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoadingReminders && sortedReminders.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <BellRing className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">{user ? "No reminders yet." : "Please log in to manage reminders."}</p>
          {user && <p className="text-sm">Click "Add New Reminder" to set one up.</p>}
        </Card>
      )}

      {!isLoadingReminders && sortedReminders.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedReminders.map(reminder => (
            <ReminderItem key={reminder.id} reminder={reminder} onDelete={handleDeleteReminder} />
          ))}
        </div>
      )}
    </div>
  );
}
