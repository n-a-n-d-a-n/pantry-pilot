import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

export interface FirebaseConfigShape {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

// 1. Try to load local config file if present (using import.meta.glob so a missing file won't fail compilation)
const configGlob = import.meta.glob<any>('../../firebase-applet-config.json', { eager: true });
const rawConfig = (configGlob['../../firebase-applet-config.json'] as any)?.default || configGlob['../../firebase-applet-config.json'] || {};

// 2. Merge with environment variable fallbacks
export const firebaseConfig: FirebaseConfigShape = {
  projectId: rawConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy-project-id',
  appId: rawConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:000000000000',
  apiKey: rawConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForFallback00000000000',
  authDomain:
    rawConfig.authDomain ||
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    `${rawConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy-project-id'}.firebaseapp.com`,
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined,
  storageBucket:
    rawConfig.storageBucket ||
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    `${rawConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy-project-id'}.firebasestorage.app`,
  messagingSenderId: rawConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: rawConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  oAuthClientId: rawConfig.oAuthClientId || import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || '',
  recaptchaSiteKey: rawConfig.recaptchaSiteKey || import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || '',
};

// Initialize Firebase safely
const app = initializeApp(firebaseConfig as any);

// CRITICAL: Must pass databaseId if specified in config, with auto-detect long polling for iframe compatibility
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });


// Error handling conforming to skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const isPermissionError =
    errorMsg.includes('permission-denied') || errorMsg.includes('Missing or insufficient permissions');

  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (isPermissionError) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Test initial connection as required by skill
export async function testFirestoreConnection(userId?: string) {
  try {
    if (userId) {
      const testDoc = doc(db, 'users', userId, 'stats', 'summary');
      await getDocFromServer(testDoc).catch(() => {
        // Document might not exist yet before first write, which is completely expected
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client operating in offline mode.');
    }
  }
}

