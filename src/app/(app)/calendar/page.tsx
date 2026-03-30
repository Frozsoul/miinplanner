
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Standalone Calendar page is deprecated.
 * The calendar is now a view mode within the Task Manager (/tasks).
 */
export default function CalendarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tasks");
  }, [router]);

  return null;
}
