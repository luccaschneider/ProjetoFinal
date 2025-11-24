'use client';

import { usePreloadData } from '@/hooks/usePreloadData';

export function PreloadProvider({ children }: { children: React.ReactNode }) {
  // Hook que faz pré-carregamento automático
  usePreloadData();
  
  return <>{children}</>;
}

