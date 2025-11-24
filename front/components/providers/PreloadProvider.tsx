'use client';

import { usePreloadData } from '@/hooks/usePreloadData';
import { usePreloadAllPages } from '@/hooks/usePreloadAllPages';

export function PreloadProvider({ children }: { children: React.ReactNode }) {
  // Hook que faz pré-carregamento automático
  usePreloadData();
  // Hook que pré-carrega TODAS as páginas e dados
  usePreloadAllPages();
  
  return <>{children}</>;
}

