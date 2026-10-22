"use client";

import { Fragment, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  BookOpen, ChevronDown, ChevronUp, FileText, FolderOpen, Link2, Loader2, Palette, Pencil, Plus, Presentation, Sheet, StickyNote, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  MAX_LINKS, MAX_NOTE_LENGTH, NoteConflictError, addTeamLink, normalizeUrl, removeTeamLink, saveTeamNote,
  subscribeTeamLinks, subscribeTeamNote, type TeamLink, type TeamNote,
} from "@/services/team-hub-service";

/**
 * Team hub on a team board: pinned links (chips under the board title) and one shared
 * "how we work" note. Any member can edit both; changes show live for everyone.
 */

function linkIcon(url: string) {
  let host = "", path = "";
  try { const u = new URL(url); host = u.hostname; path = u.pathname; } catch {}
  if (host === "docs.google.com") {
    if (path.startsWith("/spreadsheets")) return Sheet;
    if (path.startsWith("/presentation")) return Presentation;
    return FileText;
  }
  if (host === "drive.google.com") return FolderOpen;
  if (host.endsWith("canva.com") || host.endsWith("figma.com")) return Palette;
  if (host.endsWith("notion.so") || host.endsWith("notion.site")) return BookOpen;
  return Link2;
}

function hostLabel(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/** Plain text with web addresses turned into links. */
function NoteText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part)
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{part}</a>
          : <Fragment key={i}>{part}</Fragment>,
      )}
    </p>
  );
}

interface TeamHubProps {
  workspaceId: string;
  workspaceName: string;
  currentUser: { uid: string; name: string };
  /** uid to display name, for "Edited by". */
  nameOf: (uid?: string) => string | undefined;
}

export function TeamHub({ workspaceId, workspaceName, currentUser, nameOf }: TeamHubProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState<TeamLink[] | null>(null);
  const [note, setNote] = useState<TeamNote | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Add link
  const [addOpen, setAddOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<TeamLink | null>(null);

  // Note
  const [notesOpen, setNotesOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [baseVersion, setBaseVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<TeamNote | null>(null);

  useEffect(() => {
    setLinks(null);
    setNote(null);
    setUnavailable(false);
    setEditing(false);
    setConflict(null);
    const onError = (code: string) => {
      if (code === "permission-denied") setUnavailable(true);
      else console.warn("[MiinPlanner] Team hub failed to load:", code);
    };
    const offLinks = subscribeTeamLinks(workspaceId, setLinks, onError);
    const offNote = subscribeTeamNote(workspaceId, setNote, onError);
    return () => { offLinks(); offNote(); };
  }, [workspaceId]);

  // Remember per browser whether the notes card is folded, per team.
  const foldKey = `miinplanner-team-notes-open:${workspaceId}`;
  useEffect(() => {
    try {
      const v = localStorage.getItem(foldKey);
      setNotesOpen(v === null ? true : v === "1");
    } catch {}
  }, [foldKey]);
  const toggleNotes = () => {
    const next = !notesOpen;
    setNotesOpen(next);
    try { localStorage.setItem(foldKey, next ? "1" : "0"); } catch {}
  };

  // Rules not deployed yet (or no access): stay out of the way instead of breaking the board.
  if (unavailable) return null;

  const handleAddLink = async () => {
    const url = normalizeUrl(linkUrl);
    if (!url) {
      toast({ title: "That doesn't look like a web link", description: "Paste the full address, like https://drive.google.com/...", variant: "destructive" });
      return;
    }
    if ((links?.length || 0) >= MAX_LINKS) {
      toast({ title: `Up to ${MAX_LINKS} links per team`, description: "Remove one you no longer use first.", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await addTeamLink(workspaceId, currentUser.uid, linkTitle.trim() || hostLabel(url), url);
      setLinkTitle("");
      setLinkUrl("");
      setAddOpen(false);
    } catch {
      toast({ title: "Couldn't add the link", description: "Please try again.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveLink = async (link: TeamLink) => {
    try {
      await removeTeamLink(workspaceId, link.id);
      toast({ title: "Link removed", description: link.title });
    } catch {
      toast({ title: "Couldn't remove the link", variant: "destructive" });
    }
  };

  const startEditing = () => {
    setDraft(note?.text || "");
    setBaseVersion(note?.version || 0);
    setConflict(null);
    setEditing(true);
    setNotesOpen(true);
  };

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      await saveTeamNote(workspaceId, currentUser, draft, baseVersion);
      setEditing(false);
      setConflict(null);
      toast({ title: "Team notes saved" });
    } catch (err) {
      if (err instanceof NoteConflictError) {
        setConflict(err.latest);
      } else {
        toast({ title: "Couldn't save the notes", description: "Please try again.", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  // Keep my draft but build on the teammate's newer version.
  const useLatestAsBase = () => {
    if (!conflict) return;
    setBaseVersion(conflict.version);
    setConflict(null);
  };

  const editorName = note?.updatedBy === currentUser.uid ? "you" : (nameOf(note?.updatedBy) || note?.updatedByName);
  const noteText = note?.text?.trim() || "";
  const isLong = noteText.length > 280 || noteText.split("\n").length > 4;

  return (
    <div className="space-y-3">
      {/* Pinned links: one scrollable row of chips, always a click away. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
        {links === null ? (
          <span className="text-xs text-muted-foreground">Loading links...</span>
        ) : (
          links.map(link => {
            const Icon = linkIcon(link.url);
            return (
              <span key={link.id} className="group inline-flex shrink-0 items-center rounded-full border bg-background text-sm">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.url}
                  className="inline-flex max-w-[14rem] items-center gap-1.5 py-1 pl-3 pr-1 hover:underline underline-offset-2"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{link.title}</span>
                </a>
                <button
                  type="button"
                  aria-label={`Remove link ${link.title}`}
                  onClick={() => setRemoving(link)}
                  className="mr-1 rounded-full p-1 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })
        )}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 shrink-0 rounded-full border border-dashed px-3 text-muted-foreground">
              <Plus className="mr-1 h-3.5 w-3.5" /> {links && links.length > 0 ? "Link" : "Pin a link"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-2">
            <p className="text-sm font-medium">Pin a link for {workspaceName}</p>
            <p className="text-xs text-muted-foreground">Brand guide, content calendar, shared Drive folder. Everyone on the team sees it.</p>
            <Input placeholder="Link, e.g. drive.google.com/..." value={linkUrl} autoFocus onChange={e => setLinkUrl(e.target.value)} />
            <Input
              placeholder="Name (optional), e.g. Brand guide"
              value={linkTitle}
              maxLength={100}
              onChange={e => setLinkTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddLink(); }}
            />
            <Button className="w-full" onClick={handleAddLink} disabled={adding || !linkUrl.trim()}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Pin link
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Team notes: one shared "how we work" note. */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={toggleNotes} className="flex min-w-0 items-center gap-2 text-left" aria-expanded={notesOpen}>
              <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">Team notes</span>
              {note?.updatedAt && !editing && (
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                  Edited by {editorName || "a teammate"}, {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                </span>
              )}
              {notesOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
            {!editing && note !== null && (
              <Button variant="ghost" size="sm" className="h-8 shrink-0" onClick={startEditing}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> {noteText ? "Edit" : "Write"}
              </Button>
            )}
          </div>

          {notesOpen && (
            <div className="mt-3">
              {note === null ? (
                <p className="text-xs text-muted-foreground">Loading notes...</p>
              ) : editing ? (
                <div className="space-y-2">
                  {conflict && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
                      <p className="font-medium">
                        {conflict.updatedByName || "A teammate"} saved the notes while you were writing.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Your text is still here. Check their version below, merge anything you need, then save again.</p>
                      <div className="mt-2 max-h-40 overflow-y-auto rounded border bg-background p-2"><NoteText text={conflict.text || "(empty)"} /></div>
                      <Button size="sm" variant="outline" className="mt-2" onClick={useLatestAsBase}>I've merged it, let me save</Button>
                    </div>
                  )}
                  <Textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    maxLength={MAX_NOTE_LENGTH}
                    rows={8}
                    autoFocus
                    placeholder={"How this team works, for example:\n- Goal this quarter: 2 Instagram posts a week, 1 newsletter a month\n- Brand voice: friendly, short, no jargon\n- Posts need approval by Thursday\n- Who to ask about ads, design and copy"}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{draft.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setConflict(null); }} disabled={saving}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveNote} disabled={saving || !!conflict}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : noteText ? (
                <div>
                  <div className={cn(!expanded && isLong && "line-clamp-4")}>
                    <NoteText text={noteText} />
                  </div>
                  {isLong && (
                    <button type="button" onClick={() => setExpanded(v => !v)} className="mt-1 text-xs text-muted-foreground hover:text-foreground">
                      {expanded ? "Show less" : "Show more"}
                    </button>
                  )}
                  {note.updatedAt && (
                    <p className="mt-2 text-xs text-muted-foreground sm:hidden">
                      Edited by {editorName || "a teammate"}, {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Write down how {workspaceName} works: goals, brand voice, who approves what. Everyone on the team can read and edit it.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!removing} onOpenChange={open => { if (!open) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this link?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{removing?.title}&quot; is unpinned for everyone on {workspaceName}. Only the link is removed; the file itself isn&apos;t touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (removing) handleRemoveLink(removing); setRemoving(null); }}>Remove link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
