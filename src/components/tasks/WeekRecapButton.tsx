"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, Copy, Check } from "lucide-react";
import type { Task, WorkspaceMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { buildWeekRecap, recapCounts } from "@/lib/week-recap";

interface WeekRecapButtonProps {
  tasks: Task[];
  isDone: (task: Task) => boolean;
  boardName: string;
  /** Pass workspace members to group the recap by person. */
  members?: WorkspaceMember[];
  className?: string;
}

/** "Week recap" button: shows done, slipped and due next as text, with one-click copy. */
export function WeekRecapButton({ tasks, isDone, boardName, members, className }: WeekRecapButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Built when the dialog opens, so dates and "late" counts are always current.
  const text = useMemo(
    () => (open ? buildWeekRecap({ tasks, isDone, boardName, members }) : ""),
    [open, tasks, isDone, boardName, members],
  );
  const counts = useMemo(() => (open ? recapCounts(tasks, isDone) : null), [open, tasks, isDone]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Week recap copied", description: "Paste it into your team chat." });
    } catch {
      toast({ title: "Couldn't copy", description: "Select the text and copy it by hand.", variant: "destructive" });
    }
  };

  return (
    <>
      <Button variant="outline" className={className} onClick={() => setOpen(true)}>
        <ClipboardCopy className="mr-2 h-4 w-4" /> Week recap
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Week recap</DialogTitle>
            <DialogDescription>
              {counts
                ? `${counts.done} done, ${counts.overdue} slipped, ${counts.dueSoon} due in the next 7 days. `
                : ""}
              Copy it into your team chat or check-in notes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={text}
            className="min-h-[320px] max-h-[60vh] font-mono text-xs leading-relaxed"
            onFocus={e => e.currentTarget.select()}
          />
          <DialogFooter>
            <Button onClick={copy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy recap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
