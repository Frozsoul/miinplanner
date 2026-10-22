"use client";

import { useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import type { WorkspaceMember } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MAX_AVATARS = 5;

export function memberName(m: WorkspaceMember): string {
  return m.displayName || m.email.split("@")[0];
}

export function memberInitials(m: WorkspaceMember): string {
  return memberName(m).split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

interface TeamMembersProps {
  workspaceName: string;
  members: WorkspaceMember[];
  currentUid?: string;
  isOwner: boolean;
  ownerId: string;
  onInvite: (email: string) => Promise<void>;
  onRemove: (uid: string) => Promise<void> | void;
}

/** Compact members row: avatars and a count, a list on click, and Invite in a small popup. */
export function TeamMembers({ workspaceName, members, currentUid, isOwner, ownerId, onInvite, onRemove }: TeamMembersProps) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);

  const invite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    await onInvite(email.trim());
    setInviting(false);
    setEmail("");
    setInviteOpen(false);
  };

  const shown = members.slice(0, MAX_AVATARS);
  const extra = members.length - shown.length;

  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md p-1 -m-1 hover:bg-muted/60 min-w-0"
              aria-label={`Show members of ${workspaceName}`}
            >
              <div className="flex -space-x-2 shrink-0">
                {shown.map(m => (
                  <Avatar key={m.uid} className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-primary/10">{memberInitials(m)}</AvatarFallback>
                  </Avatar>
                ))}
                {extra > 0 && (
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-[10px]">+{extra}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {members.length} member{members.length === 1 ? "" : "s"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Members of {workspaceName}</p>
            <div className="max-h-72 overflow-y-auto">
              {members.map(m => (
                <div key={m.uid} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-primary/10">{memberInitials(m)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {memberName(m)}{m.uid === currentUid ? " (you)" : ""}{m.uid === ownerId ? " · Owner" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  {isOwner && m.uid !== currentUid && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive shrink-0"
                      aria-label={`Remove ${memberName(m)}`}
                      onClick={() => setRemoving(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={inviteOpen} onOpenChange={setInviteOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-2">
            <p className="text-sm font-medium">Invite to {workspaceName}</p>
            <p className="text-xs text-muted-foreground">They need a MiinPlanner account with this email.</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") invite(); }}
              />
              <Button size="icon" onClick={invite} disabled={inviting || !email.trim()} aria-label="Send invite">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>

      <AlertDialog open={!!removing} onOpenChange={open => { if (!open) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing ? memberName(removing) : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to {workspaceName}. Team tasks stay on the board, including ones assigned to them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (removing) onRemove(removing.uid); setRemoving(null); }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
