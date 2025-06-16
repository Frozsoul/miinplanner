
"use client";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionButtons?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actionButtons }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary hidden sm:block" />}
          <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold">{title}</h1>
            {description && <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        {actionButtons && <div className="mt-2 sm:mt-0">{actionButtons}</div>}
      </div>
    </div>
  );
}
