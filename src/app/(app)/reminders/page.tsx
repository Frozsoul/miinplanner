
"use client";

import { useState } from "react";
import type { Reminder } from "@/types";
import useLocalStorage from "@/hooks/use-local-storage";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/tasks/date-picker";
import { PlusCircle, Trash2, BellRing } from "lucide-react";
import { format, parseISO } from 'date-fns';
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

const ReminderItem = ({ reminder, onDelete }: { reminder: Reminder; onDelete: (id: string) => void; }) => {
  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><BellRing className="h-5 w-5 text-accent" /> {reminder.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Remind on: {format(parseISO(reminder.remindAt), "PPPp")}</p>
      </CardContent>
    </Card>
  );
};

export default function RemindersPage() {
  const { user } = useAuth(); // Get the authenticated user
  const remindersStorageKey = user ? `miinplanner_reminders_${user.uid}` : "miinplanner_reminders_guest"; // Create user-specific key

  const [reminders, setReminders] = useLocalStorage<Reminder[]>(remindersStorageKey, []);
  const [newReminder, setNewReminder] = useState<{ title: string; remindAt?: Date }>({ title: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddReminder = () => {
    if (newReminder.title.trim() === "" || !newReminder.remindAt) return;
    const reminderToAdd: Reminder = { 
      id: Date.now().toString(), 
      title: newReminder.title,
      remindAt: newReminder.remindAt.toISOString(), 
      triggered: false 
    };
    setReminders(prevReminders => [...prevReminders, reminderToAdd]);
    setNewReminder({ title: "" });
    setIsFormOpen(false);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
  };
  
  const sortedReminders = [...reminders].sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Reminders</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Add New Reminder</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Reminder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={newReminder.title} onChange={e => setNewReminder({ ...newReminder, title: e.target.value })} className="col-span-3" placeholder="Reminder title" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="remindAt" className="text-right">Remind At</Label>
                <DatePicker 
                  date={newReminder.remindAt} 
                  setDate={(date) => setNewReminder({ ...newReminder, remindAt: date })} 
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddReminder} disabled={!newReminder.title || !newReminder.remindAt}>Add Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sortedReminders.length === 0 && user ? (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <BellRing className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">No reminders yet.</p>
          <p className="text-sm">Click "Add New Reminder" to set one up.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedReminders.map(reminder => (
            <ReminderItem key={reminder.id} reminder={reminder} onDelete={handleDeleteReminder} />
          ))}
        </div>
      )}
    </div>
  );
}
