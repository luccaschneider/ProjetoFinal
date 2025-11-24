import { useState, useEffect, useCallback } from 'react';
import { getCacheInfo, clearAllCache, clearExpiredCache } from '@/lib/cacheService';
import { useNetworkStatus } from './useNetworkStatus';

export function useCache() {
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());
  const isOnline = useNetworkStatus();

  const refreshCacheInfo = useCallback(() => {
    setCacheInfo(getCacheInfo());
  }, []);

  const clearCache = useCallback(() => {
    clearAllCache();
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  const clearExpired = useCallback(() => {
    clearExpiredCache();
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  useEffect(() => {
    // Limpar cache expirado periodicamente
    const interval = setInterval(() => {
      clearExpiredCache();
      refreshCacheInfo();
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [refreshCacheInfo]);

  return {
    cacheInfo,
    clearCache,
    clearExpired,
    refreshCacheInfo,
    isOnline,
  };
}

