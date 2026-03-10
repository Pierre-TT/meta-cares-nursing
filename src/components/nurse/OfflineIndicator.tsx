import { useEffect, useRef } from 'react';
import { WifiOff, Cloud, RefreshCw } from 'lucide-react';
import { Badge } from '@/design-system';
import { useOfflineClinicalSync } from '@/hooks/useOfflineClinicalSync';

export function OfflineIndicator() {
  const { snapshot, flushWoundQueue, syncBelraiQueue, isSyncing } = useOfflineClinicalSync();
  const { online, pendingCount } = snapshot;
  const autoSyncKeyRef = useRef('');

  useEffect(() => {
    if (!online || pendingCount === 0 || isSyncing) {
      return;
    }

    const autoSyncKey = `${online}-${pendingCount}`;
    if (autoSyncKeyRef.current === autoSyncKey) {
      return;
    }

    autoSyncKeyRef.current = autoSyncKey;

    void flushWoundQueue().then(() => syncBelraiQueue());
  }, [flushWoundQueue, isSyncing, online, pendingCount, syncBelraiQueue]);

  useEffect(() => {
    if (!online) {
      autoSyncKeyRef.current = '';
    }
  }, [online]);

  // Don't show anything when online and nothing to sync
  if (online && pendingCount === 0 && !isSyncing) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between text-xs font-medium transition-colors ${
        !online
          ? 'bg-mc-amber-500 text-white'
          : isSyncing
            ? 'bg-mc-blue-500 text-white'
            : 'bg-mc-green-500 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {!online ? (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Mode hors ligne - les brouillons BelRAI et plaies restent en file locale</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Synchronisation clinique en cours...</span>
          </>
        ) : (
          <>
            <Cloud className="h-3.5 w-3.5" />
            <span>Connexion retablie</span>
          </>
        )}
      </div>
      {pendingCount > 0 && (
        <Badge variant="default" className="bg-white/20 text-white">
          {pendingCount} en attente
        </Badge>
      )}
    </div>
  );
}
