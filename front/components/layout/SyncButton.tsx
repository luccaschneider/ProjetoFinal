'use client';

import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SyncButton() {
  const { pendingCount, isSyncing, hasPending, sync, isOnline } = useOfflineSync();

  const handleSync = async () => {
    if (!isOnline) {
      return;
    }
    await sync();
  };

  // Não mostrar se não houver pendências
  if (!hasPending) {
    return null;
  }

  return (
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
  );
}

