
import { type ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-lg shadow-2xl">
        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-primary p-8">
            <Image 
                src="https://placehold.co/800x1000.png" 
                alt="Auth background" 
                width={800} 
                height={1000}
                className="object-cover rounded-md"
                data-ai-hint="abstract modern" 
            />
        </div>
        <div className="w-full md:w-1/2 bg-card p-8 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}
