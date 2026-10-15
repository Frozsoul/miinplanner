import { redirect } from "next/navigation";

// The dashboard was retired in favour of the Task Manager (with "Up next" at the top).
// Kept as a redirect so old bookmarks and links still work.
export default function DashboardPage() {
  redirect("/tasks");
}
