import { useState, useEffect, useCallback } from 'react';
import { getPendingCount } from '@/lib/offlineStorage';
import { syncPendingOperations, hasPendingOperations, getPendingOperationsCount, type SyncResult } from '@/lib/syncService';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const isOnline = useNetworkStatus();

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingCount());
  }, []);

  const sync = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return lastSyncResult || { success: 0, failed: 0, errors: [] };
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingOperations();
      setLastSyncResult(result);
      refreshPendingCount();
      return result;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      const errorResult: SyncResult = {
        success: 0,
        failed: 0,
        errors: [{ operation: {} as any, error }],
      };
      setLastSyncResult(errorResult);
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, lastSyncResult, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    
    // Atualizar contador quando a conexão voltar
    if (isOnline) {
      const interval = setInterval(() => {
        refreshPendingCount();
      }, 2000); // Verificar a cada 2 segundos quando online

      return () => clearInterval(interval);
    }
  }, [isOnline, refreshPendingCount]);

  return {
    pendingCount,
    isSyncing,
    hasPending: hasPendingOperations(),
    sync,
    refreshPendingCount,
    isOnline,
    lastSyncResult,
  };
}

