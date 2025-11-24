'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const HEALTH_CHECK_INTERVAL_ONLINE = 15000; // 15 segundos quando online
const HEALTH_CHECK_INTERVAL_OFFLINE = 10000; // 10 segundos quando offline
const HEALTH_CHECK_TIMEOUT = 3000; // 3 segundos de timeout
const STATUS_CHANGE_DEBOUNCE = 1000; // 1 segundo de debounce para mudanças de status

// Estado global compartilhado para evitar múltiplas verificações
let globalStatus: boolean = true;
let globalInterval: NodeJS.Timeout | null = null;
let globalCheckFunction: (() => Promise<void>) | null = null;
let isInitialized: boolean = false;
let isCheckingGlobal: boolean = false;
let lastStatusChangeGlobal: number = 0;
const subscribers = new Set<() => void>();

// Função para atualizar o intervalo global
function updateGlobalInterval(status: boolean) {
  // Limpar intervalo anterior
  if (globalInterval) {
    clearInterval(globalInterval);
    globalInterval = null;
  }

  // Criar novo intervalo baseado no status
  const interval = status ? HEALTH_CHECK_INTERVAL_ONLINE : HEALTH_CHECK_INTERVAL_OFFLINE;
  globalInterval = setInterval(() => {
    if (globalCheckFunction && !isCheckingGlobal) {
      globalCheckFunction();
    }
  }, interval);
}

// Função para notificar todos os subscribers
function notifySubscribers(status: boolean) {
  globalStatus = status;
  subscribers.forEach((callback) => callback());
}

export function useNetworkStatus() {
  // Usar estado global como inicial para evitar reinicializações
  const [isOnline, setIsOnline] = useState(globalStatus);
  const isCheckingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStatusRef = useRef(globalStatus); // Ref para o status atual (sem causar re-renders)
  const mountedRef = useRef(true);

  const checkBackendHealth = async () => {
    // Se não houver conexão de rede, não precisa verificar
    if (!navigator.onLine) {
      const wasOnline = globalStatus;
      if (wasOnline) {
        notifySubscribers(false);
      }
      return;
    }

    // Evitar múltiplas verificações simultâneas (globalmente)
    if (isCheckingGlobal || isCheckingRef.current) {
      return;
    }

    isCheckingGlobal = true;
    isCheckingRef.current = true;

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();

    // Configurar timeout
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, HEALTH_CHECK_TIMEOUT);

      // Tentar fazer uma requisição simples ao backend
      // Usar um endpoint que não requer autenticação (GET de eventos)
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
        // Usar cache: 'no-cache' para sempre verificar
        cache: 'no-cache',
      });

      // Limpar timeout se a requisição completou
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Se a requisição foi bem-sucedida, backend está online
      const newStatus = response.ok || response.status < 500;
      const wasOnline = currentStatusRef.current;
      
      // Só atualizar se realmente mudou e respeitar debounce
      if (wasOnline !== newStatus) {
        const now = Date.now();
        const timeSinceLastChange = now - lastStatusChangeGlobal;
        
        // Se mudou recentemente, aguardar um pouco antes de mudar novamente (debounce)
        if (timeSinceLastChange < STATUS_CHANGE_DEBOUNCE) {
          // Aguardar o tempo restante do debounce antes de atualizar
          setTimeout(() => {
            notifySubscribers(newStatus);
            lastStatusChangeGlobal = Date.now();
            updateGlobalInterval(newStatus);
          }, STATUS_CHANGE_DEBOUNCE - timeSinceLastChange);
        } else {
          // Atualizar imediatamente se passou tempo suficiente
          notifySubscribers(newStatus);
          lastStatusChangeGlobal = now;
          updateGlobalInterval(newStatus);
        }
      }
    } catch (error: any) {
      // Limpar timeout em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const wasOnline = globalStatus;
      
      // Só atualizar se realmente mudou e respeitar debounce
      if (wasOnline) {
        const now = Date.now();
        const timeSinceLastChange = now - lastStatusChangeGlobal;
        
        // Se mudou recentemente, aguardar um pouco antes de mudar novamente (debounce)
        if (timeSinceLastChange < STATUS_CHANGE_DEBOUNCE) {
          // Aguardar o tempo restante do debounce antes de atualizar
          setTimeout(() => {
            notifySubscribers(false);
            lastStatusChangeGlobal = Date.now();
            updateGlobalInterval(false);
          }, STATUS_CHANGE_DEBOUNCE - timeSinceLastChange);
        } else {
          // Atualizar imediatamente se passou tempo suficiente
          notifySubscribers(false);
          lastStatusChangeGlobal = now;
          updateGlobalInterval(false);
        }
      }
    } finally {
      isCheckingGlobal = false;
      isCheckingRef.current = false;
    }
  };

  // Armazenar referência da função globalmente
  globalCheckFunction = checkBackendHealth;

  useEffect(() => {
    mountedRef.current = true;

    // Callback para atualizar estado local quando status global muda
    const updateLocalStatus = () => {
      if (mountedRef.current && isOnline !== globalStatus) {
        currentStatusRef.current = globalStatus;
        setIsOnline(globalStatus);
      }
    };

    // Adicionar subscriber
    subscribers.add(updateLocalStatus);

    // Sincronizar estado local com estado global inicialmente
    if (isOnline !== globalStatus) {
      currentStatusRef.current = globalStatus;
      setIsOnline(globalStatus);
    }

    // Só inicializar uma vez globalmente
    if (!isInitialized) {
      isInitialized = true;
      
      // Iniciar intervalo global baseado no status atual
      updateGlobalInterval(globalStatus);

      // Listeners para eventos de rede do navegador (globais)
      const handleOnline = () => {
        // Quando a conexão volta, verificar imediatamente
        if (globalCheckFunction && !isCheckingGlobal) {
          globalCheckFunction();
        }
      };

      const handleOffline = () => {
        // Quando perde conexão, marcar como offline imediatamente (sem debounce para eventos do navegador)
        if (globalStatus) {
          notifySubscribers(false);
          lastStatusChangeGlobal = Date.now();
          updateGlobalInterval(false);
        }
      };

      // Listener para quando a tab volta ao foco
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Quando a tab volta ao foco, verificar imediatamente
          if (globalCheckFunction && !isCheckingGlobal) {
            globalCheckFunction();
          }
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      mountedRef.current = false;
      subscribers.delete(updateLocalStatus);
      
      // Cancelar requisição pendente apenas deste componente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return isOnline;
}

