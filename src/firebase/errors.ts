
/**
 * @fileOverview Defines the specialized FirestorePermissionError and its context.
 */

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  path: string;
  operation: string;
  requestResourceData?: any;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore permission denied: ${context.operation} at ${context.path}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.path = context.path;
    this.operation = context.operation;
    this.requestResourceData = context.requestResourceData;

    // This is for Next.js to show a nice error object in the overlay if we re-throw it
    (this as any).digest = JSON.stringify(context, null, 2);
  }
}
