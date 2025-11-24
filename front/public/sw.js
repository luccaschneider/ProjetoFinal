// Service Worker para cachear páginas e assets quando offline
const CACHE_NAME = 'microsservicos-v1';
const RUNTIME_CACHE = 'microsservicos-runtime-v1';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições para APIs externas (deixar o axios lidar com isso via localStorage)
  // O Service Worker só cacheia páginas HTML e assets estáticos
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return; // Deixar passar para o axios/interceptor lidar
  }

  // Estratégia: Cache First para páginas HTML, Network First para assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Se estiver offline e tiver cache, usar cache imediatamente
      if (!navigator.onLine && cachedResponse) {
        return cachedResponse;
      }

      // Tentar buscar da rede
      return fetch(request)
        .then((response) => {
          // Se a resposta for válida, cachear
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar e tiver cache, usar cache
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se não tiver cache e for HTML, retornar página offline básica
          if (request.headers.get('accept')?.includes('text/html')) {
            return new Response('Offline - Conteúdo não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html',
              }),
            });
          }
          // Para outros tipos, retornar erro
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

