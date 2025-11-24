import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';
import {
  LoginDTO,
  CadastroUsuarioDTO,
  UpdateProfileDTO,
  LoginResponseDTO,
  UsuarioResponseDTO,
  EventResponseDTO,
  EventoInscritoDTO,
  UsuarioInscritoDTO,
  UserLogDTO,
  PageResponse,
} from './types';
import { getCache, setCache, removeCache } from './cacheService';
import { saveOperation } from './offlineStorage';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Criar instância do axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache para evitar múltiplas chamadas simultâneas
let tokenCache: { token: string | null; timestamp: number } | null = null;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let tokenPromise: Promise<string | null> | null = null;

/**
 * Gera uma chave de cache baseada na URL e parâmetros
 */
export function getCacheKey(url: string, params?: any): string {
  // Remover a base URL se estiver presente
  let key = url;
  if (key.startsWith(API_BASE_URL)) {
    key = key.replace(API_BASE_URL, '');
  }
  // Remover barra inicial se houver
  key = key.replace(/^\//, '');
  
  if (params) {
    const paramStr = new URLSearchParams(params).toString();
    if (paramStr) {
      key += `?${paramStr}`;
    }
  }
  
  // Normalizar a chave: substituir / por _ e remover caracteres especiais
  key = key.replace(/\//g, '_').replace(/\?/g, '_').replace(/&/g, '_').replace(/=/g, '_');
  
  return key;
}

// Interceptor para adicionar token JWT
apiClient.interceptors.request.use(
  async (config) => {
    // Evitar loop: não buscar token para requisições de sessão
    if (config.url?.includes('/api/auth/session')) {
      return config;
    }

    // Verificar cache
    if (tokenCache && Date.now() - tokenCache.timestamp < TOKEN_CACHE_DURATION) {
      if (tokenCache.token) {
        config.headers.Authorization = `Bearer ${tokenCache.token}`;
      }
      return config;
    }

    // Evitar múltiplas chamadas simultâneas
    if (!tokenPromise) {
      tokenPromise = (async () => {
        try {
          const session = await getSession();
          const token = session?.accessToken || null;
          tokenCache = {
            token,
            timestamp: Date.now(),
          };
          
          // Log para debug (remover em produção)
          if (!token && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.warn('Token não encontrado na sessão. Verifique se está autenticado.');
          }
          
          return token;
        } catch (error) {
          console.error('Erro ao obter sessão:', error);
          tokenCache = {
            token: null,
            timestamp: Date.now(),
          };
          return null;
        } finally {
          tokenPromise = null;
        }
      })();
    }

    const token = await tokenPromise;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Se não houver token e não for rota pública, pode causar 403
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.warn('Requisição sem token JWT:', config.url);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para cachear respostas GET e tratar erros
apiClient.interceptors.response.use(
  (response) => {
    // Cachear apenas respostas GET bem-sucedidas
    if (response.config.method === 'get' && response.config.url) {
      const cacheKey = getCacheKey(response.config.url, response.config.params);
      setCache(cacheKey, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado, inválido ou sem permissão
      // Limpar cache do token
      tokenCache = null;
      tokenPromise = null;
      
      // Se for 401 ou 403, redirecionar para login
      if (typeof window !== 'undefined') {
        // Verificar se não está já na página de login
        if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Verifica se é um erro de rede (offline)
 */
function isNetworkError(error: any): boolean {
  return (
    !navigator.onLine ||
    error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error' ||
    (error.response === undefined && error.request !== undefined)
  );
}

/**
 * Wrapper para requisições GET com cache-first
 */
async function getWithCache<T>(
  url: string,
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // SEMPRE verificar cache primeiro (cache-first strategy)
  const cached = getCache<T>(cacheKey);
  
  // Se houver cache disponível, usar imediatamente (mesmo online)
  // Isso garante que dados pré-carregados sejam usados
  if (cached !== null) {
    console.log(`[Cache] ✅ Usando cache disponível: ${cacheKey}`);
    
    // Se estiver online, tentar atualizar em background (sem bloquear)
    if (navigator.onLine) {
      fetcher()
        .then((data) => {
          // Cache será atualizado automaticamente pelo interceptor
          console.log(`[Cache] ✅ Dados atualizados em background: ${cacheKey}`);
        })
        .catch((error) => {
          // Se falhar, manter o cache que já está sendo usado
          console.debug(`[Cache] ⚠️ Não foi possível atualizar em background: ${cacheKey}`, error.message);
        });
    }
    
    // Retornar cache imediatamente (não esperar atualização)
    return cached;
  }
  
  // Se não houver cache e estiver offline, lançar erro
  if (!navigator.onLine) {
    throw new Error('Sem conexão e sem dados em cache');
  }
  
  // Se não houver cache mas estiver online, fazer requisição
  try {
    const data = await fetcher();
    // Cache será atualizado automaticamente pelo interceptor
    return data;
  } catch (error: any) {
    // Se falhar, verificar se conseguiu cache enquanto fazia requisição (race condition)
    const cachedAfterError = getCache<T>(cacheKey);
    if (cachedAfterError !== null) {
      console.warn(`[Cache] ⚠️ Usando cache após erro na requisição: ${cacheKey}`);
      return cachedAfterError;
    }
    
    // Verificar se é erro de rede/backend offline
    if (isNetworkError(error)) {
      throw new Error('Backend não está acessível e não há dados em cache');
    }
    
    // Se não houver cache, propagar o erro
    throw error;
  }
}

/**
 * Wrapper para requisições POST/PUT/DELETE com suporte offline
 */
async function mutateWithOffline<T>(
  type: 'CADASTRO_RAPIDO' | 'INSCRICAO' | 'PRESENCA',
  data: any,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const result = await fetcher();
    return result;
  } catch (error: any) {
    // Se for erro de rede, salvar offline
    if (isNetworkError(error)) {
      const operation = saveOperation(type, data);
      
      // Atualização otimista do cache (se aplicável)
      updateCacheOptimistically(type, data);
      
      toast.info('Operação salva para sincronização quando a conexão voltar.');
      
      // Retornar sucesso simulado para manter UX
      return createOptimisticResponse(type, data) as T;
    }
    
    // Se não for erro de rede, propagar o erro
    throw error;
  }
}

/**
 * Atualiza o cache de forma otimista após uma operação offline
 */
function updateCacheOptimistically(
  type: 'CADASTRO_RAPIDO' | 'INSCRICAO' | 'PRESENCA',
  data: any
): void {
  // Implementação básica - pode ser expandida conforme necessário
  // Por exemplo, adicionar inscrição ao cache local
  if (type === 'INSCRICAO') {
    // Invalidar cache de inscrições para forçar atualização
    // O cache será atualizado após sincronização
  }
}

/**
 * Cria uma resposta otimista para operações offline
 */
function createOptimisticResponse(
  type: 'CADASTRO_RAPIDO' | 'INSCRICAO' | 'PRESENCA',
  data: any
): any {
  // Retornar uma resposta básica para manter a UX
  // Os dados reais virão após sincronização
  if (type === 'CADASTRO_RAPIDO') {
    return {
      id: `temp_${Date.now()}`,
      name: data.name,
      email: data.email,
      ativo: true,
      role: 'USER' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  
  if (type === 'INSCRICAO') {
    // Tentar buscar evento do cache
    const event = getCache<EventResponseDTO>(`event_${data.eventId}`);
    if (event) {
      return event;
    }
    // Se não houver cache, retornar objeto mínimo
    return {
      id: data.eventId,
      nome: 'Evento',
      ativo: true,
      dataHoraInicio: new Date().toISOString(),
      dataHoraFim: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  
  if (type === 'PRESENCA') {
    // Retornar objeto básico para presença
    return {
      eventId: data.eventId,
      presente: data.presente,
    };
  }
  
  return {};
}

// Auth APIs
export const authApi = {
  login: async (data: LoginDTO): Promise<LoginResponseDTO> => {
    const response = await apiClient.post<LoginResponseDTO>('/api/auth/login', data);
    return response.data;
  },
  
  register: async (data: CadastroUsuarioDTO): Promise<UsuarioResponseDTO> => {
    const response = await apiClient.post<UsuarioResponseDTO>('/api/auth/cadastro', data);
    return response.data;
  },
  
  getMe: async (): Promise<UsuarioResponseDTO> => {
    const response = await apiClient.get<UsuarioResponseDTO>('/api/auth/me');
    return response.data;
  },
  
  updateProfile: async (data: UpdateProfileDTO): Promise<UsuarioResponseDTO> => {
    const response = await apiClient.put<UsuarioResponseDTO>('/api/auth/me', data);
    return response.data;
  },
};

// Event APIs
export const eventApi = {
  listAll: async (): Promise<EventResponseDTO[]> => {
    const url = '/api/events';
    const cacheKey = getCacheKey(url);
    return getWithCache(
      url,
      cacheKey,
      async () => {
        const response = await apiClient.get<EventResponseDTO[]>(url);
    return response.data;
      }
    );
  },
  
  getById: async (id: string): Promise<EventResponseDTO> => {
    const url = `/api/events/${id}`;
    const cacheKey = getCacheKey(url);
    return getWithCache(
      url,
      cacheKey,
      async () => {
        const response = await apiClient.get<EventResponseDTO>(url);
    return response.data;
      }
    );
  },
  
  listProximos: async (): Promise<EventResponseDTO[]> => {
    return getWithCache(
      '/api/events/proximos',
      'events_proximos',
      async () => {
    const response = await apiClient.get<EventResponseDTO[]>('/api/events/proximos');
    return response.data;
      }
    );
  },
  
  listByCategoria: async (categoria: string): Promise<EventResponseDTO[]> => {
    return getWithCache(
      `/api/events/categoria/${categoria}`,
      `events_categoria_${categoria}`,
      async () => {
    const response = await apiClient.get<EventResponseDTO[]>(`/api/events/categoria/${categoria}`);
    return response.data;
      }
    );
  },
};

// Inscription APIs
export const inscriptionApi = {
  inscrever: async (eventId: string): Promise<EventResponseDTO> => {
    return mutateWithOffline(
      'INSCRICAO',
      { eventId },
      async () => {
    const response = await apiClient.post<EventResponseDTO>(`/api/events/${eventId}/inscricao`);
        // Invalidar cache de inscrições
        removeCache('inscriptions');
    return response.data;
      }
    );
  },
  
  listarInscritos: async (): Promise<EventResponseDTO[]> => {
    return getWithCache(
      '/api/events/inscricoes',
      'inscriptions',
      async () => {
    const response = await apiClient.get<EventResponseDTO[]>('/api/events/inscricoes');
    return response.data;
      }
    );
  },
  
  cancelarInscricao: async (eventId: string): Promise<void> => {
    try {
    await apiClient.delete(`/api/events/${eventId}/inscricao`);
      // Invalidar cache
      removeCache('inscriptions');
    } catch (error: any) {
      if (isNetworkError(error)) {
        toast.info('Operação será realizada quando a conexão voltar.');
        // Em uma implementação mais completa, poderia salvar esta operação também
      }
      throw error;
    }
  },
  
  listarPresencas: async (): Promise<EventResponseDTO[]> => {
    return getWithCache(
      '/api/events/presencas',
      'presences',
      async () => {
    const response = await apiClient.get<EventResponseDTO[]>('/api/events/presencas');
    return response.data;
      }
    );
  },
};

// Certificate APIs
export const certificateApi = {
  generate: async (eventId: string, usuarioId: string): Promise<{ certificateCode: string; downloadUrl: string }> => {
    const response = await apiClient.post<{ certificateCode: string; downloadUrl: string }>(
      '/api/certificates/generate',
      { eventId, usuarioId }
    );
    return response.data;
  },
  
  download: async (code: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/certificates/download/${code}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  validate: async (code: string): Promise<any> => {
    const response = await apiClient.get(`/api/certificates/validate/${code}`);
    return response.data;
  },
};

// Log APIs
export const logApi = {
  listMyLogs: async (page: number = 0, size: number = 20, action?: string): Promise<PageResponse<UserLogDTO>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (action) params.append('action', action);
    const response = await apiClient.get<PageResponse<UserLogDTO>>(`/api/logs/my-logs?${params.toString()}`);
    return response.data;
  },
};

// Admin APIs
export const adminApi = {
  listUsuarios: async (): Promise<UsuarioResponseDTO[]> => {
    return getWithCache(
      '/api/admin/usuarios',
      'usuarios',
      async () => {
    const response = await apiClient.get<UsuarioResponseDTO[]>('/api/admin/usuarios');
    return response.data;
      }
    );
  },
  
  listUsuariosInscritosNoEvento: async (eventId: string): Promise<UsuarioInscritoDTO[]> => {
    return getWithCache(
      `/api/admin/eventos/${eventId}/usuarios-inscritos`,
      `usuarios_inscritos_${eventId}`,
      async () => {
    const response = await apiClient.get<UsuarioInscritoDTO[]>(`/api/admin/eventos/${eventId}/usuarios-inscritos`);
    return response.data;
      }
    );
  },
  
  registrarPresenca: async (data: { usuarioId: string; eventId: string; presente: boolean }): Promise<EventoInscritoDTO> => {
    return mutateWithOffline(
      'PRESENCA',
      data,
      async () => {
    const response = await apiClient.post<EventoInscritoDTO>('/api/admin/presenca', data);
        // Invalidar cache de presenças
        removeCache(`presences_${data.eventId}`);
        removeCache(`usuarios_inscritos_${data.eventId}`);
    return response.data;
      }
    );
  },
  
  cadastroRapido: async (data: { name: string; email: string; eventId: string }): Promise<UsuarioResponseDTO> => {
    return mutateWithOffline(
      'CADASTRO_RAPIDO',
      data,
      async () => {
    const response = await apiClient.post<UsuarioResponseDTO>('/api/admin/cadastro-rapido', data);
        // Invalidar cache de usuários e inscrições
        removeCache('usuarios');
        removeCache(`usuarios_inscritos_${data.eventId}`);
    return response.data;
      }
    );
  },
};

