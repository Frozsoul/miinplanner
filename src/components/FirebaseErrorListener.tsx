
'use client';

/**
 * @fileOverview Component that listens for FirestorePermissionErrors and surfaces them to the UI.
 */

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // In development, we want to throw this so it hits the Next.js error overlay
      if (process.env.NODE_ENV === 'development') {
        // We throw it asynchronously to ensure it's not caught by the emitter's own loop
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // In production, we just log it or show a toast via other means
        console.error('[MiinPlanner] Firestore Permission Denied:', error);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, []);

  return null;
}
