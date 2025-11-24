'use client';

import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SyncButton() {
  const { pendingCount, isSyncing, hasPending, sync, isOnline } = useOfflineSync();

  const handleSync = async () => {
    if (!isOnline) {
      return;
    }
    await sync();
  };

  if (!hasPending && isOnline) {
    return null; // Não mostrar se não houver pendências e estiver online
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <Badge variant="outline" className="text-xs">
          <CloudOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      {hasPending && (
        <Button
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          size="sm"
          variant={isOnline ? "default" : "outline"}
          className="relative"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          {pendingCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}

