
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
        viewBox="0 0 2318.8 234.1"
        style={{ enableBackground: "new 0 0 2318.8 234.1" }}
        xmlSpace="preserve"
        className="h-6 w-auto"
      >
        <style>{`
          .st0{fill:none;}
          /* .st1 is for #1C1A1A, not directly used for main logo elements on dark bg */
          .st2{fill:var(--accent);} /* Accent color for DIGITAL */
          .st3{fill:var(--foreground);} /* Main color for MIIN and shapes */
          /* .st4 font-family removed to inherit from body */
          .st5{font-size:160px;}
        `}</style>
        <g>
          <polygon className="st3" points="781.1,124.8 813.7,147 866.7,115.6 866.7,159.1 900,178.9 900,57.9 	"/>
          <polygon className="st3" points="1036.2,124.8 1003.7,147 950.6,115.6 950.6,159.1 917.3,178.9 917.3,57.9 	"/>
        </g>
        <text transform="matrix(2.3291 0 0 1 41.3633 177.0051)" className="st3 st5">MIIN</text>
        <text transform="matrix(2.3291 0 0 1 1063.3652 176.6809)" className="st2 st5">DIGITAL</text>
      </svg>
    </Link>
  );
}
