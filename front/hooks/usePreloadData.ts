'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { eventApi, inscriptionApi } from '@/lib/api';
import { EventResponseDTO } from '@/lib/types';

const PRELOAD_KEY = 'data_preloaded';
const PRELOAD_INTERVAL = 5 * 60 * 1000; // 5 minutos
const PRELOAD_DETAILS_KEY = 'event_details_preloaded';

/**
 * Hook para pré-carregar dados importantes quando a aplicação carrega
 * Isso garante que os dados estejam em cache para uso offline
 */
export function usePreloadData() {
  const { data: session, status } = useSession();
  const isPreloadingRef = useRef(false);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Só pré-carregar se estiver online e não tiver pré-carregado recentemente
    if (!navigator.onLine || isPreloadingRef.current || hasPreloadedRef.current) {
      return;
    }

    // Verificar se já pré-carregou recentemente
    const lastPreload = localStorage.getItem(PRELOAD_KEY);
    if (lastPreload) {
      const lastPreloadTime = parseInt(lastPreload, 10);
      const now = Date.now();
      if (now - lastPreloadTime < PRELOAD_INTERVAL) {
        hasPreloadedRef.current = true;
        return;
      }
    }

    // Iniciar pré-carregamento
    isPreloadingRef.current = true;

    const preloadData = async () => {
      try {
        console.log('Iniciando pré-carregamento de dados...');

        // 1. Carregar lista de todos os eventos
        const events = await eventApi.listAll();
        console.log(`✓ ${events.length} eventos carregados`);

        // 2. Verificar se já pré-carregou detalhes recentemente
        const lastDetailsPreload = localStorage.getItem(PRELOAD_DETAILS_KEY);
        const shouldPreloadDetails = !lastDetailsPreload || 
          (Date.now() - parseInt(lastDetailsPreload, 10)) > PRELOAD_INTERVAL;

        if (shouldPreloadDetails && events.length > 0) {
          // Carregar detalhes de TODOS os eventos IMEDIATAMENTE
          console.log(`🔄 Iniciando pré-carregamento de detalhes de ${events.length} eventos...`);
          
          // Processar em lotes maiores e mais rápidos
          const batchSize = 10; // Aumentar tamanho do lote
          for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            
            // Usar Promise.allSettled para não parar em caso de erro
            await Promise.allSettled(
              batch.map((event) =>
                eventApi.getById(event.id).catch((error) => {
                  // Não logar erro para não poluir console
                  console.debug(`Evento ${event.id} não pôde ser pré-carregado`);
                  return null;
                })
              )
            );
            
            // Delay mínimo entre lotes (50ms) para não sobrecarregar
            if (i + batchSize < events.length) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
          
          localStorage.setItem(PRELOAD_DETAILS_KEY, Date.now().toString());
          console.log(`✅ Carregados detalhes de todos os ${events.length} eventos`);
        } else {
          console.log('ℹ️ Detalhes já pré-carregados recentemente, pulando...');
        }

        // 3. Se o usuário estiver autenticado, carregar dados do usuário
        if (status === 'authenticated' && session) {
          try {
            await inscriptionApi.listarInscritos();
            console.log('✓ Inscrições carregadas');
          } catch (error) {
            console.warn('Erro ao carregar inscrições:', error);
          }

          try {
            await inscriptionApi.listarPresencas();
            console.log('✓ Presenças carregadas');
          } catch (error) {
            console.warn('Erro ao carregar presenças:', error);
          }
        }

        // Marcar como pré-carregado
        localStorage.setItem(PRELOAD_KEY, Date.now().toString());
        hasPreloadedRef.current = true;
        console.log('✓ Pré-carregamento concluído');
      } catch (error) {
        console.error('Erro no pré-carregamento:', error);
      } finally {
        isPreloadingRef.current = false;
      }
    };

    // Aguardar um pouco antes de iniciar para não bloquear o carregamento inicial
    const timeoutId = setTimeout(() => {
      preloadData();
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [status, session]);

  // Pré-carregar novamente quando o usuário fizer login
  useEffect(() => {
    if (status === 'authenticated' && session && hasPreloadedRef.current && navigator.onLine) {
      // Resetar flag para permitir pré-carregamento após login
      hasPreloadedRef.current = false;
      localStorage.removeItem(PRELOAD_KEY);
    }
  }, [status, session]);
}

