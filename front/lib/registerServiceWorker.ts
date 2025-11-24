'use client';

/**
 * Registra o Service Worker para cachear páginas e assets
 */
export function registerServiceWorker() {
  // Verificar se está no cliente e se Service Worker é suportado
  if (typeof window === 'undefined') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    // Não logar como erro, apenas ignorar silenciosamente
    return;
  }

  // Verificar se já está registrado
  if (navigator.serviceWorker.controller) {
    return;
  }

  // Aguardar o carregamento completo da página
  if (document.readyState === 'loading') {
    window.addEventListener('load', () => {
      registerSW();
    });
  } else {
    // Página já carregou, registrar imediatamente
    registerSW();
  }

  function registerSW() {
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
        // Logar apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('[SW] Erro ao registrar Service Worker:', error);
        }
      });
  }
}

