
import { type ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-lg shadow-2xl">
        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-primary p-8">
            {/*
              To use your own image:
              1. Create a 'public' folder in the root of your project (if it doesn't exist).
              2. Place your image in the 'public' folder (e.g., public/my-auth-image.jpg).
              3. Update the 'src' below to '/my-auth-image.jpg'.
              4. Update the 'alt' text and 'data-ai-hint' accordingly.
            */}
            <Image
                src="https://miindigital.com/wp-content/uploads/2025/06/logbanner.jpg"
                alt="MiinDigital brand banner"
                width={800}
                height={1000}
                className="object-cover rounded-md"
                data-ai-hint="brand image"
                priority // Add priority if this is an LCP element
            />
        </div>
        <div className="w-full md:w-1/2 bg-card p-8 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}
