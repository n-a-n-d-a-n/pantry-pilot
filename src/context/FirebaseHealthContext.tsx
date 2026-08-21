import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../lib/firebase';

export type ConnectionStatus = 'connected' | 'connecting' | 'error';
export type ErrorType = 'permission-denied' | 'network' | 'unauthenticated' | 'quota-exceeded' | 'other' | null;

export interface FirebaseHealthState {
  status: ConnectionStatus;
  errorType: ErrorType;
  message: string;
  lastChecked: Date | null;
  source: 'server' | 'cache' | null;
  projectId: string;
  databaseId: string;
  isChecking: boolean;
  checkConnection: () => Promise<void>;
  reportSnapshotSuccess: (fromCache: boolean) => void;
  reportSnapshotError: (error: unknown, path?: string) => void;
}

const FirebaseHealthContext = createContext<FirebaseHealthState | undefined>(undefined);

export function parseFirestoreError(error: unknown): { errorType: ErrorType; message: string } {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code || '';

  if (
    errorCode === 'permission-denied' ||
    errorMsg.includes('permission-denied') ||
    errorMsg.includes('Missing or insufficient permissions') ||
    errorMsg.includes('PERMISSION_DENIED')
  ) {
    return {
      errorType: 'permission-denied',
      message: 'Security rules may not be deployed or access was denied.',
    };
  }

  if (
    errorCode === 'unavailable' ||
    errorCode === 'deadline-exceeded' ||
    errorMsg.includes('offline') ||
    errorMsg.includes('network') ||
    errorMsg.includes('the client is offline') ||
    errorMsg.includes('Failed to get document because the client is offline')
  ) {
    return {
      errorType: 'network',
      message: 'Network connection is offline or Firestore service is unavailable.',
    };
  }

  if (errorCode === 'resource-exhausted' || errorMsg.includes('Quota exceeded')) {
    return {
      errorType: 'quota-exceeded',
      message: 'Firestore quota limit reached. Please check the Firebase console.',
    };
  }

  return {
    errorType: 'other',
    message: errorMsg || 'An unknown error occurred while communicating with Firestore.',
  };
}

export const FirebaseHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [message, setMessage] = useState<string>('Initializing connection to Firestore...');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [source, setSource] = useState<'server' | 'cache' | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const hasInitializedServerSync = useRef<boolean>(false);

  const reportSnapshotSuccess = useCallback((fromCache: boolean) => {
    if (!fromCache) {
      hasInitializedServerSync.current = true;
      setStatus('connected');
      setErrorType(null);
      setMessage('Firestore live & connected (server synchronized)');
      setSource('server');
      setLastChecked(new Date());
    } else if (!hasInitializedServerSync.current) {
      setSource('cache');
      setStatus('connecting');
      setMessage('Loading data from local cache; connecting to live server...');
    }
  }, []);

  const reportSnapshotError = useCallback((error: unknown, path?: string) => {
    const { errorType: type, message: msg } = parseFirestoreError(error);
    setStatus('error');
    setErrorType(type);
    setMessage(path ? `${msg} (Path: ${path})` : msg);
    setLastChecked(new Date());
  }, []);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setStatus('connecting');
      setErrorType('unauthenticated');
      setMessage('Waiting for user authentication...');
      setLastChecked(new Date());
      setIsChecking(false);
      return;
    }

    try {
      setStatus('connecting');
      setMessage('Pinging Firestore server...');
      
      // Perform a direct server read against the user's stats doc (bypasses cache)
      const testDoc = doc(db, 'users', currentUser.uid, 'stats', 'summary');
      await getDocFromServer(testDoc);

      hasInitializedServerSync.current = true;
      setStatus('connected');
      setErrorType(null);
      setMessage('Firestore live & connected (server verified)');
      setSource('server');
      setLastChecked(new Date());
    } catch (error: any) {
      // getDocFromServer throws if doc doesn't exist OR if rules/network fail
      // If the error is not-found, it still reached the server successfully!
      if (error?.code === 'not-found' || error?.message?.includes('not-found')) {
        hasInitializedServerSync.current = true;
        setStatus('connected');
        setErrorType(null);
        setMessage('Firestore live & connected (server verified)');
        setSource('server');
        setLastChecked(new Date());
      } else {
        const { errorType: type, message: msg } = parseFirestoreError(error);
        setStatus('error');
        setErrorType(type);
        setMessage(msg);
        setLastChecked(new Date());
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Listen to auth state changes to trigger connection checks
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkConnection();
      } else {
        setStatus('connecting');
        setErrorType('unauthenticated');
        setMessage('Not signed in. Sign in to synchronize with Firestore.');
        setLastChecked(new Date());
      }
    });

    return () => unsubscribe();
  }, [checkConnection]);

  return (
    <FirebaseHealthContext.Provider
      value={{
        status,
        errorType,
        message,
        lastChecked,
        source,
        projectId: firebaseConfig.projectId || 'Unknown',
        databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        isChecking,
        checkConnection,
        reportSnapshotSuccess,
        reportSnapshotError,
      }}
    >
      {children}
    </FirebaseHealthContext.Provider>
  );
};

export function useFirebaseHealth(): FirebaseHealthState {
  const context = useContext(FirebaseHealthContext);
  if (!context) {
    throw new Error('useFirebaseHealth must be used within a FirebaseHealthProvider');
  }
  return context;
}
