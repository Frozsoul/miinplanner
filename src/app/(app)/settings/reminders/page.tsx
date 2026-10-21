"use client";

import { useEffect, useState } from "react";
import { Bell, Copy, Check, RefreshCw, Loader2, ExternalLink, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { syncDigestAction, updateDigestAction, type DigestSettings } from "@/services/email-digest-actions";
import { DIGEST_TIMES } from "@/lib/email-digest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getCalendarFeedAction, resetCalendarFeedAction } from "@/services/calendar-feed-actions";
import { REMINDERS_SETUP_KEY } from "@/components/tasks/RemindersBanner";

import { browserTimeZone } from "@/components/DigestSync";

function timeLabel(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** Daily email: on by default, sent at the chosen local time on days something is due. */
function DailyEmailCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<DigestSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const result = await syncDigestAction(await user.getIdToken(), browserTimeZone());
      if (!cancelled && result.ok) setSettings(result.data);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = async (next: { enabled: boolean; sendAt: string }) => {
    if (!user || !settings) return;
    const previous = settings;
    setSettings({ ...settings, ...next });
    setSaving(true);
    const result = await updateDigestAction(await user.getIdToken(), { ...next, timeZone: browserTimeZone() });
    setSaving(false);
    if (result.ok) {
      setSettings(result.data);
      toast({ title: next.enabled ? `Daily email at ${timeLabel(result.data.sendAt)}` : "Daily email turned off" });
    } else {
      setSettings(previous);
      toast({ title: "Couldn't save", description: result.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Daily email</CardTitle>
        <CardDescription>
          A short morning email with what's due today, what's overdue and high priority tasks due tomorrow.
          It only comes on days you have something due, and works on any phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!settings ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-medium">
              <Switch
                checked={settings.enabled}
                disabled={saving}
                onCheckedChange={enabled => save({ enabled, sendAt: settings.sendAt })}
                aria-label="Daily email"
              />
              {settings.enabled ? "On" : "Off"}
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Send at</span>
              <Select
                value={settings.sendAt}
                disabled={saving || !settings.enabled}
                onValueChange={sendAt => save({ enabled: settings.enabled, sendAt })}
              >
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIGEST_TIMES.map(t => <SelectItem key={t} value={t}>{timeLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-xs">{settings.timeZone}</span>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Sent to {user?.email}. Each email has a link to turn it off.
        </p>
      </CardContent>
    </Card>
  );
}

export default function RemindersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getCalendarFeedAction(await user.getIdToken(), browserTimeZone());
      if (cancelled) return;
      if (result.ok) setToken(result.data.token);
      else setError(result.message);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://planner.miindigital.com";
  const feedUrl = token ? `${origin}/api/calendar/${token}.ics` : "";
  const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");
  const googleUrl = feedUrl ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}` : "";

  // Hides the Task Manager banner once the user has actually added or copied the link.
  const markSetup = () => {
    try { localStorage.setItem(REMINDERS_SETUP_KEY, "1"); } catch {}
  };

  const handleCopy = async () => {
    markSetup();
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Select the link and copy it manually.", variant: "destructive" });
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    const result = await resetCalendarFeedAction(await user.getIdToken(), browserTimeZone());
    setResetting(false);
    if (result.ok) {
      setToken(result.data.token);
      toast({ title: "New link created", description: "The old link no longer works. Add the new one to your calendar." });
    } else {
      toast({ title: "Couldn't reset the link", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <DailyEmailCard />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Reminders in your calendar</CardTitle>
          <CardDescription>
            Add your tasks to Google, Apple or Outlook Calendar. Every task with a due date shows up on that day,
            and your phone reminds you at 9am. High and urgent tasks also get a heads-up the day before.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating your private link...
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {token && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={markSetup}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Add to Google Calendar
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={webcalUrl} onClick={markSetup}>Add to Apple or Outlook</a>
                </Button>
              </div>
              <div className="space-y-2">
                <label htmlFor="feed-url" className="text-sm font-medium">Or copy your private link</label>
                <div className="flex gap-2">
                  <Input id="feed-url" readOnly value={feedUrl} onFocus={e => e.currentTarget.select()} className="font-mono text-xs" />
                  <Button variant="outline" onClick={handleCopy} aria-label="Copy link">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Includes your personal tasks and team tasks assigned to you. Done and archived tasks are left out.</li>
                <li>Calendars refresh the link on their own schedule. Google can take several hours; Apple usually within the hour.</li>
                <li>In Google Calendar, turn on notifications for the &quot;MiinPlanner tasks&quot; calendar in its settings to get alerts.</li>
              </ul>
            </>
          )}
        </CardContent>
        {token && (
          <CardFooter className="border-t pt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Anyone with this link can see your task titles and due dates. Keep it private.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={resetting}>
                  {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Reset link
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset your calendar link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The current link stops working right away. Calendars using it will stop updating until you add the new link.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Reset link</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
