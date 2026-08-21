import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useFirebaseHealth } from '../context/FirebaseHealthContext';

interface FirebaseHealthIndicatorProps {
  variant?: 'navbar' | 'footer' | 'standalone';
  className?: string;
}

export const FirebaseHealthIndicator: React.FC<FirebaseHealthIndicatorProps> = ({
  variant = 'navbar',
  className = '',
}) => {
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

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    <div className={`relative inline-flex items-center shrink-0 ${className}`} ref={popoverRef}>
      {/* Subtle Trigger Button */}
      <button
        type="button"
        id="btn-firebase-health-indicator"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-[#F5F5F0]/80 dark:bg-[#262320]/80 hover:bg-[#EAE8E0] dark:hover:bg-[#332E2A] border border-[#E5E1D8]/80 dark:border-[#3D3833]/80 transition-all text-xs font-medium text-[#6B635B] dark:text-[#A8A29E] active:scale-95 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
        title={`Firebase Backend: ${getStatusLabel()} (Click for diagnostic info)`}
        aria-label="Firebase backend connection health indicator"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {status === 'connected' ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          ) : status === 'connecting' ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </>
          )}
        </span>
        <span className="hidden 2xl:inline text-[11px] font-medium tracking-tight">
          {status === 'connected' ? 'DB Live' : status === 'connecting' ? 'Connecting' : 'DB Alert'}
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white/95 dark:bg-[#1E1B18]/95 backdrop-blur-md border border-[#F0EAD6] dark:border-[#3D3833] rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#F0EAD6] dark:border-[#3D3833]">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#F27D26]" />
              <h4 className="text-xs font-bold text-[#2D2926] dark:text-[#F5F3EF]">
                Firebase Backend Health
              </h4>
            </div>
            <button
              type="button"
              onClick={() => checkConnection()}
              disabled={isChecking}
              className="p-1 text-[#8C8279] dark:text-[#A8A29E] hover:text-[#2D2926] dark:hover:text-[#F5F3EF] hover:bg-[#F5F5F0] dark:hover:bg-[#2A2622] rounded-lg transition-colors disabled:opacity-50"
              title="Ping and test Firestore connection"
              aria-label="Ping Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#F27D26]' : ''}`} />
            </button>
          </div>

          {/* Status Badge & Message */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8C8279] dark:text-[#A8A29E]">Status</span>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F0] dark:bg-[#2A2622]">
                <span className={`w-1.5 h-1.5 rounded-full ${getDotClass()}`}></span>
                <span className={getStatusColor()}>{getStatusLabel()}</span>
              </div>
            </div>

            {/* Diagnostic Alert Message */}
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 ${
                status === 'connected'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900/60'
                  : status === 'connecting'
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/60'
                  : 'bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200/60 dark:border-red-900/60'
              }`}
            >
              {getStatusIcon()}
              <div className="min-w-0">
                <p className="font-semibold leading-tight text-[11px]">
                  {errorType === 'permission-denied'
                    ? 'Security Rules Error (permission-denied)'
                    : errorType === 'network'
                    ? 'Network Connectivity Error'
                    : status === 'connected'
                    ? 'Live Server Synchronized'
                    : 'Connecting to Backend'}
                </p>
                <p className="text-[10px] opacity-90 mt-0.5 leading-normal break-words">{message}</p>
              </div>
            </div>

            {/* Distinct guidance if permission denied */}
            {errorType === 'permission-denied' && (
              <div className="p-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/70 rounded-lg text-[10px] text-amber-800 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Diagnostic Tip:
                </p>
                <p className="mt-0.5">
                  Firestore rejected this request because security rules are not yet deployed or
                  deny access to your user document path.
                </p>
              </div>
            )}
          </div>

          {/* Diagnostic Metadata */}
          <div className="space-y-1.5 pt-2 border-t border-[#F0EAD6] dark:border-[#3D3833] text-[10px] text-[#8C8279] dark:text-[#A8A29E]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3" /> Project ID
              </span>
              <span className="font-mono text-[#2D2926] dark:text-[#F5F3EF] truncate max-w-[140px]">
                {projectId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Database ID</span>
              <span className="font-mono text-[#2D2926] dark:text-[#F5F3EF] truncate max-w-[140px]" title={databaseId}>
                {databaseId === '(default)' ? '(default)' : `${databaseId.substring(0, 16)}...`}
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
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Last Checked
                </span>
                <span>{lastChecked.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="mt-3 pt-2 border-t border-[#F0EAD6] dark:border-[#3D3833]">
            <button
              type="button"
              onClick={() => checkConnection()}
              disabled={isChecking}
              className="w-full py-1.5 px-2 bg-[#F5F5F0] dark:bg-[#262320] hover:bg-[#EAE8E0] dark:hover:bg-[#332E2A] text-[#2D2926] dark:text-[#F5F3EF] font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-[#F27D26]' : ''}`} />
              <span>{isChecking ? 'Testing Firestore Roundtrip...' : 'Re-test Server Connection'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
