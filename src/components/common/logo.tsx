
import { Rocket } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Rocket className="h-7 w-7 text-sidebar-primary" />
      <span className="text-xl font-bold font-headline text-sidebar-foreground">
        MiinPlanner
      </span>
    </Link>
  );
}
