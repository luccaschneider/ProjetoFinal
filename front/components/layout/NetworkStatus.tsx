'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const isOnline = useNetworkStatus();

  return (
    <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      )}
    </Badge>
  );
}

