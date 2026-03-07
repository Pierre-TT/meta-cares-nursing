import { useCallback, useEffect, useRef, useState } from 'react';
import { WifiOff, Cloud, RefreshCw } from 'lucide-react';
import { Badge } from '@/design-system';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const pendingSyncRef = useRef(pendingSync);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    pendingSyncRef.current = pendingSync;
  }, [pendingSync]);

  const clearSyncTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const triggerSync = useCallback(() => {
    if (pendingSyncRef.current === 0) {
      return;
    }

    clearSyncTimeout();
    setSyncing(true);
    timeoutRef.current = window.setTimeout(() => {
      pendingSyncRef.current = 0;
      setPendingSync(0);
      setSyncing(false);
      timeoutRef.current = null;
    }, 2000);
  }, [clearSyncTimeout]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      clearSyncTimeout();
      setOnline(false);
      setSyncing(false);
      setPendingSync((p) => {
        const nextPendingSync = p + 1;
        pendingSyncRef.current = nextPendingSync;
        return nextPendingSync;
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearSyncTimeout();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [clearSyncTimeout, triggerSync]);

  // Don't show anything when online and nothing to sync
  if (online && pendingSync === 0 && !syncing) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between text-xs font-medium transition-colors ${
        !online
          ? 'bg-mc-amber-500 text-white'
          : syncing
            ? 'bg-mc-blue-500 text-white'
            : 'bg-mc-green-500 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {!online ? (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Mode hors-ligne — Les données seront synchronisées automatiquement</span>
          </>
        ) : syncing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Synchronisation en cours…</span>
          </>
        ) : (
          <>
            <Cloud className="h-3.5 w-3.5" />
            <span>Connexion rétablie</span>
          </>
        )}
      </div>
      {pendingSync > 0 && (
        <Badge variant="default" className="bg-white/20 text-white">
          {pendingSync} en attente
        </Badge>
      )}
    </div>
  );
}
