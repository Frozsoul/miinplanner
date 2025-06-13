
import { redirect } from 'next/navigation';

// This page will now be the landing/entry point.
// If a user is logged in, they might be redirected to /dashboard from (app)/layout.tsx
// If not, they might be redirected to /login from (app)/layout.tsx
// For now, let's assume it attempts to go to dashboard, and auth checks handle the rest.
export default function HomePage() {
  redirect('/dashboard'); 
  // The actual redirection to /login if not authenticated
  // will happen in src/app/(app)/layout.tsx
  return null;
}
