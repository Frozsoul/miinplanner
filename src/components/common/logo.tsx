
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center", className)}>
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 500 500"
        xmlSpace="preserve"
        className="h-6 w-auto" // This will control the size
      >
        <path fill="none" d="M4,196.5"/>
        <g>
          <polygon fill="var(--foreground)" points="4,262 66.8,304.9 169.1,244.2 169.1,328.1 233.3,366.3 233.3,133 	"/>
          <polygon fill="var(--accent)" points="496,262 433.2,304.9 330.9,244.2 330.9,328.1 266.7,366.3 266.7,133 	"/>
        </g>
      </svg>
    </Link>
  );
}
