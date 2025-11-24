interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresIn: number; // milissegundos
}

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_TTL: Record<string, number> = {
  events: 60 * 60 * 1000, // 1 hora
  event: 60 * 60 * 1000, // 1 hora
  inscriptions: 30 * 60 * 1000, // 30 minutos
  presences: 30 * 60 * 1000, // 30 minutos
  usuarios: 30 * 60 * 1000, // 30 minutos
  logs: 10 * 60 * 1000, // 10 minutos
  default: 60 * 60 * 1000, // 1 hora padrão
};

/**
 * Obtém o TTL (Time To Live) para uma chave específica
 */
function getTTL(key: string): number {
  // Extrair o tipo da chave (ex: 'events', 'events_123', 'inscriptions')
  const keyType = key.split('_')[0];
  return DEFAULT_TTL[keyType] || DEFAULT_TTL.default;
}

/**
 * Gera a chave completa para o localStorage
 */
function getStorageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * Obtém dados do cache
 */
export function getCache<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined' || !localStorage) {
      return null;
    }
    const storageKey = getStorageKey(key);
    const cached = localStorage.getItem(storageKey);
    
    if (!cached) {
      return null;
    }

    const cachedData: CachedData = JSON.parse(cached);
    
    // Verificar se expirou
    const now = Date.now();
    const age = now - cachedData.timestamp;
    
    if (age > cachedData.expiresIn) {
      // Cache expirado, remover
      localStorage.removeItem(storageKey);
      return null;
    }

    return cachedData.data as T;
  } catch (error) {
    console.error('Erro ao ler cache:', error);
    return null;
  }
}

/**
 * Salva dados no cache
 */
export function setCache(key: string, data: any): void {
  const storageKey = getStorageKey(key);
  const expiresIn = getTTL(key);
  
  const cachedData: CachedData = {
    key,
    data,
    timestamp: Date.now(),
    expiresIn,
  };

  try {
    if (typeof window === 'undefined' || !localStorage) {
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
    // Se o localStorage estiver cheio, tentar limpar caches antigos
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearExpiredCache();
      // Tentar novamente
      try {
        localStorage.setItem(storageKey, JSON.stringify(cachedData));
      } catch (retryError) {
        console.error('Erro ao salvar cache após limpeza:', retryError);
      }
    }
  }
}

/**
 * Remove um item específico do cache
 */
export function removeCache(key: string): void {
  try {
    if (typeof window === 'undefined' || !localStorage) {
      return;
    }
    const storageKey = getStorageKey(key);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Erro ao remover cache:', error);
  }
}

/**
 * Limpa todos os caches expirados
 */
export function clearExpiredCache(): void {
  try {
    if (typeof window === 'undefined' || !localStorage) {
      return;
    }
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cachedData: CachedData = JSON.parse(cached);
            const age = now - cachedData.timestamp;
            
            if (age > cachedData.expiresIn) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Se houver erro ao ler, remover a chave
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
  }
}

/**
 * Limpa todo o cache
 */
export function clearAllCache(): void {
  try {
    if (typeof window === 'undefined' || !localStorage) {
      return;
    }
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar todo o cache:', error);
  }
}

/**
 * Verifica se um item está em cache e é válido
 */
export function hasCache(key: string): boolean {
  return getCache(key) !== null;
}

/**
 * Obtém todas as chaves de cache
 */
export function getAllCacheKeys(): string[] {
  try {
    if (typeof window === 'undefined' || !localStorage) {
      return [];
    }
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => key.replace(CACHE_PREFIX, ''));
  } catch (error) {
    console.error('Erro ao obter chaves de cache:', error);
    return [];
  }
}

/**
 * Obtém informações sobre o cache (útil para debug)
 */
export function getCacheInfo(): { total: number; keys: string[] } {
  const keys = getAllCacheKeys();
  return {
    total: keys.length,
    keys,
  };
}

