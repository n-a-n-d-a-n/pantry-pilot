import React, { useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  WifiOff,
  Radio,
  Server,
  Info,
  X,
} from 'lucide-react';
import { useFirebaseHealth } from '../context/FirebaseHealthContext';

interface FirebaseHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseHealthModal: React.FC<FirebaseHealthModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    errorType,
    message,
    lastChecked,
    source,
    projectId,
    databaseId,
    isChecking,
    checkConnection,
  } = useFirebaseHealth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500 text-emerald-700 dark:text-emerald-300';
      case 'connecting':
        return 'bg-amber-500 text-amber-700 dark:text-amber-300';
      case 'error':
        return 'bg-red-500 text-red-700 dark:text-red-300';
    }
  };

  const getDotClass = () => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'connecting':
        return 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      case 'error':
        return 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Live Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        if (errorType === 'permission-denied') return 'Rules Not Deployed';
        if (errorType === 'network') return 'Network Offline';
        return 'Connection Error';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'connecting':
        return <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />;
      case 'error':
        if (errorType === 'permission-denied') {
          return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />;
        }
        if (errorType === 'network') {
          return <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />;
        }
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1E1B18] border border-[#F0EAD6] dark:border-[#3D3833] rounded-2xl shadow-2xl p-5 w-full max-w-sm sm:max-w-md text-left transition-colors relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0EAD6] dark:border-[#3D3833]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF2E6] dark:bg-[#382012] flex items-center justify-center text-[#F27D26]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                Firebase Backend Health
              </h3>
              <p className="text-[11px] text-[#8C8279] dark:text-[#A8A29E]">
                Cloud Firestore synchronization & diagnostics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2A2622] rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge & Message */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8279] dark:text-[#A8A29E]">Connection State</span>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F5F5F0] dark:bg-[#2A2622]">
              <span className={`w-2 h-2 rounded-full ${getDotClass()}`}></span>
              <span className={getStatusColor()}>{getStatusLabel()}</span>
            </div>
          </div>

          {/* Diagnostic Alert Message */}
          <div
            className={`p-3 rounded-xl text-xs flex items-start space-x-2.5 ${
              status === 'connected'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-900/60'
                : status === 'connecting'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/60'
                : 'bg-red-50/90 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200/80 dark:border-red-900/60'
            }`}
          >
            <div className="mt-0.5">{getStatusIcon()}</div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight text-xs">
                {errorType === 'permission-denied'
                  ? 'Security Rules Error (permission-denied)'
                  : errorType === 'network'
                  ? 'Network Connectivity Error'
                  : status === 'connected'
                  ? 'Live Cloud Firestore Connected'
                  : 'Connecting to Backend'}
              </p>
              <p className="text-[11px] opacity-90 mt-1 leading-normal break-words">{message}</p>
            </div>
          </div>

          {/* Distinct guidance if permission denied */}
          {errorType === 'permission-denied' && (
            <div className="p-2.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/70 rounded-xl text-[11px] text-amber-800 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                Diagnostic Tip:
              </p>
              <p className="mt-1 leading-relaxed">
                Firestore rejected this request because security rules are not yet deployed or
                deny access to your user document path.
              </p>
            </div>
          )}
        </div>

        {/* Diagnostic Metadata */}
        <div className="space-y-2 pt-3 border-t border-[#F0EAD6] dark:border-[#3D3833] text-xs text-[#8C8279] dark:text-[#A8A29E]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Project ID
            </span>
            <span className="font-mono font-medium text-[#2D2926] dark:text-[#F5F3EF] truncate max-w-[180px]">
              {projectId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Database ID</span>
            <span className="font-mono font-medium text-[#2D2926] dark:text-[#F5F3EF] truncate max-w-[180px]" title={databaseId}>
              {databaseId}
            </span>
          </div>

          {source && (
            <div className="flex items-center justify-between">
              <span>Active Source</span>
              <span className="font-semibold capitalize text-[#2D2926] dark:text-[#F5F3EF]">
                {source === 'server' ? 'Live Server Stream' : 'Local Cache'}
              </span>
            </div>
          )}

          {lastChecked && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Last Checked
              </span>
              <span className="text-[#2D2926] dark:text-[#F5F3EF] font-medium">{lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 pt-3 border-t border-[#F0EAD6] dark:border-[#3D3833] flex items-center gap-2">
          <button
            type="button"
            onClick={() => checkConnection()}
            disabled={isChecking}
            className="flex-1 py-2 px-3 bg-[#F27D26] hover:bg-[#E06D19] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Testing Connection...' : 'Test Connection'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-[#F5F5F0] dark:bg-[#262320] hover:bg-[#EAE8E0] dark:hover:bg-[#332E2A] text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
