import { redirect } from "next/navigation";

// AI Insights became the Companion page (score, mood, check-ins and what's slipping).
// Kept as a redirect so old bookmarks and links still work.
export default function InsightsPage() {
  redirect("/companion");
}
