'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { eventApi, inscriptionApi, authApi, logApi, adminApi } from '@/lib/api';

const PRELOAD_ALL_PAGES_KEY = 'all_pages_preloaded';
const PRELOAD_ALL_PAGES_INTERVAL = 10 * 60 * 1000; // 10 minutos

/**
 * Hook para pré-carregar TODAS as páginas e dados do site na primeira carga
 * Isso garante que o site funcione completamente offline após o primeiro carregamento
 */
export function usePreloadAllPages() {
  const { data: session, status } = useSession();
  const isPreloadingRef = useRef(false);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Só pré-carregar se estiver online e não tiver pré-carregado recentemente
    if (typeof window === 'undefined' || !navigator.onLine || isPreloadingRef.current || hasPreloadedRef.current) {
      return;
    }

    // Verificar se já pré-carregou recentemente
    const lastPreload = localStorage.getItem(PRELOAD_ALL_PAGES_KEY);
    if (lastPreload) {
      const lastPreloadTime = parseInt(lastPreload, 10);
      const now = Date.now();
      if (now - lastPreloadTime < PRELOAD_ALL_PAGES_INTERVAL) {
        hasPreloadedRef.current = true;
        return;
      }
    }

    // Iniciar pré-carregamento completo
    isPreloadingRef.current = true;

    const preloadAllPages = async () => {
      try {
        console.log('🚀 Iniciando pré-carregamento COMPLETO de todas as páginas...');

        // 1. Carregar TODOS os eventos e seus detalhes
        const events = await eventApi.listAll();
        console.log(`✓ ${events.length} eventos carregados`);
        
        // Pré-carregar detalhes de TODOS os eventos
        if (events.length > 0) {
          console.log(`🔄 Pré-carregando detalhes de ${events.length} eventos...`);
          const batchSize = 10;
          for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map((event) =>
                eventApi.getById(event.id, true).catch(() => null)
              )
            );
            if (i + batchSize < events.length) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
          console.log(`✅ Detalhes de todos os ${events.length} eventos carregados`);
        }

        // 2. Se autenticado, carregar dados do usuário
        if (status === 'authenticated' && session) {
          try {
            await authApi.getMe();
            console.log('✓ Perfil do usuário carregado');
          } catch (error) {
            console.debug('Erro ao carregar perfil:', error);
          }

          try {
            await inscriptionApi.listarInscritos();
            console.log('✓ Inscrições carregadas');
          } catch (error) {
            console.debug('Erro ao carregar inscrições:', error);
          }

          try {
            await inscriptionApi.listarPresencas();
            console.log('✓ Presenças carregadas');
          } catch (error) {
            console.debug('Erro ao carregar presenças:', error);
          }

          try {
            await logApi.listMyLogs(0, 20);
            console.log('✓ Logs carregados');
          } catch (error) {
            console.debug('Erro ao carregar logs:', error);
          }

          // Se for admin, carregar dados de admin
          if (session.user?.role === 'ADMIN') {
            try {
              await adminApi.listUsuarios();
              console.log('✓ Lista de usuários (admin) carregada');
            } catch (error) {
              console.debug('Erro ao carregar usuários:', error);
            }

            // Para cada evento, pré-carregar lista de inscritos (admin)
            for (const event of events.slice(0, 10)) { // Limitar a 10 para não sobrecarregar
              try {
                await adminApi.listUsuariosInscritosNoEvento(event.id);
              } catch (error) {
                // Ignorar erros silenciosamente
              }
            }
            console.log('✓ Dados de admin carregados');
          }
        }

        // Marcar como pré-carregado
        localStorage.setItem(PRELOAD_ALL_PAGES_KEY, Date.now().toString());
        hasPreloadedRef.current = true;
        console.log('✅ Pré-carregamento COMPLETO concluído - Site pronto para uso offline!');
      } catch (error) {
        console.error('Erro no pré-carregamento completo:', error);
      } finally {
        isPreloadingRef.current = false;
      }
    };

    // Aguardar um pouco antes de iniciar para não bloquear o carregamento inicial
    const timeoutId = setTimeout(() => {
      preloadAllPages();
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [status, session]);

  // Resetar flag quando usuário fizer login para pré-carregar dados do usuário
  useEffect(() => {
    if (typeof window !== 'undefined' && status === 'authenticated' && session && hasPreloadedRef.current && navigator.onLine) {
      hasPreloadedRef.current = false;
      localStorage.removeItem(PRELOAD_ALL_PAGES_KEY);
    }
  }, [status, session]);
}

