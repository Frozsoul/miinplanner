
"use client";
import { redirect } from "next/navigation";

// The main settings page now redirects to the first settings section.
export default function SettingsPage() {
  redirect('/settings/billing');
  return null;
}
