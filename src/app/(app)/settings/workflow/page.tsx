
"use client";

import { TaskSpacesManager } from "@/components/settings/TaskSpacesManager";
import { StatusManager } from "@/components/settings/StatusManager";

export default function WorkflowPage() {
  return (
    <div className="space-y-6">
      <TaskSpacesManager />
      <StatusManager />
    </div>
  );
}
