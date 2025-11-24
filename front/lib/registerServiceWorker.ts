'use client';

/**
 * Registra o Service Worker para cachear páginas e assets
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker não suportado');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
        
        // Verificar atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // A cada hora
      })
      .catch((error) => {
        console.error('[SW] Erro ao registrar Service Worker:', error);
      });
  });
}

