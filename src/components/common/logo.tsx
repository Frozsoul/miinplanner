
import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2", className)}>
      <Rocket className="h-7 w-7 text-sidebar-primary" />
      <span className="text-xl font-bold font-headline text-sidebar-foreground">
        MiinPlanner
      </span>
    </Link>
  );
}
