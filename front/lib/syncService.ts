import { getPendingOperations, removeOperation, incrementRetry, removeMaxRetriesOperations, type PendingOperation } from './offlineStorage';
import { adminApi, inscriptionApi, apiClient } from './api';
import { setCache, removeCache } from './cacheService';
import { toast } from 'sonner';
import type { UsuarioResponseDTO, EventResponseDTO, EventoInscritoDTO } from './types';

export interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ operation: PendingOperation; error: any }>;
}

/**
 * Sincroniza uma operação de cadastro rápido
 * Usa apiClient diretamente para evitar mutateWithOffline durante sincronização
 */
async function syncCadastroRapido(operation: PendingOperation): Promise<boolean> {
  try {
    // Chamar diretamente a API sem passar por mutateWithOffline
    const response = await apiClient.post<UsuarioResponseDTO>('/api/admin/cadastro-rapido', operation.data);
    
    // Atualizar cache de usuários
    removeCache('usuarios');
    
    // Se houver eventId, atualizar cache de inscrições e presenças
    if (operation.data.eventId) {
      removeCache('inscriptions');
      removeCache(`presences_${operation.data.eventId}`);
      removeCache(`usuarios_inscritos_${operation.data.eventId}`);
    }
    
    return true;
  } catch (error: any) {
    // Se o erro for que o usuário já existe, considerar sucesso
    if (error.response?.status === 400 && 
        (error.response?.data?.message?.includes('já cadastrado') || 
         error.response?.data?.message?.includes('já existe') ||
         error.response?.data?.message?.includes('already'))) {
      // Limpar cache para forçar atualização
      removeCache('usuarios');
      if (operation.data.eventId) {
        removeCache(`usuarios_inscritos_${operation.data.eventId}`);
      }
      return true;
    }
    throw error;
  }
}

/**
 * Sincroniza uma operação de inscrição
 * Usa apiClient diretamente para evitar mutateWithOffline durante sincronização
 */
async function syncInscricao(operation: PendingOperation): Promise<boolean> {
  try {
    // Chamar diretamente a API sem passar por mutateWithOffline
    await apiClient.post<EventResponseDTO>(`/api/events/${operation.data.eventId}/inscricao`);
    
    // Atualizar cache de inscrições
    removeCache('inscriptions');
    removeCache(`event_${operation.data.eventId}`);
    
    return true;
  } catch (error: any) {
    // Se o erro for que já está inscrito, considerar sucesso
    if (error.response?.status === 400 && 
        (error.response?.data?.message?.includes('já inscrito') ||
         error.response?.data?.message?.includes('already'))) {
      // Limpar cache para forçar atualização
      removeCache('inscriptions');
      removeCache(`event_${operation.data.eventId}`);
      return true;
    }
    throw error;
  }
}

/**
 * Sincroniza uma operação de presença
 * Usa apiClient diretamente para evitar mutateWithOffline durante sincronização
 */
async function syncPresenca(operation: PendingOperation): Promise<boolean> {
  try {
    // Chamar diretamente a API sem passar por mutateWithOffline
    await apiClient.post<EventoInscritoDTO>('/api/admin/presenca', operation.data);
    
    // Atualizar cache de presenças
    removeCache(`presences_${operation.data.eventId}`);
    removeCache(`usuarios_inscritos_${operation.data.eventId}`);
    
    return true;
  } catch (error: any) {
    // Se o erro for que a presença já foi registrada, considerar sucesso
    if (error.response?.status === 400 && 
        (error.response?.data?.message?.includes('já registrada') ||
         error.response?.data?.message?.includes('already'))) {
      // Limpar cache para forçar atualização
      removeCache(`presences_${operation.data.eventId}`);
      removeCache(`usuarios_inscritos_${operation.data.eventId}`);
      return true;
    }
    throw error;
  }
}

/**
 * Sincroniza uma operação individual
 */
async function syncOperation(operation: PendingOperation): Promise<boolean> {
  switch (operation.type) {
    case 'CADASTRO_RAPIDO':
      return await syncCadastroRapido(operation);
    case 'INSCRICAO':
      return await syncInscricao(operation);
    case 'PRESENCA':
      return await syncPresenca(operation);
    default:
      console.warn('Tipo de operação desconhecido:', operation.type);
      return false;
  }
}

/**
 * Sincroniza todas as operações pendentes
 */
export async function syncPendingOperations(): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Verificar se está no cliente
  if (typeof window === 'undefined') {
    return result;
  }

  // Verificar se está online
  if (!navigator.onLine) {
    // Usar setTimeout para evitar problemas de hidratação
    setTimeout(() => {
      toast.error('Sem conexão com a internet. Conecte-se para sincronizar.');
    }, 0);
    return result;
  }

  // Remover operações que excederam tentativas
  const removed = removeMaxRetriesOperations();
  if (removed > 0) {
    setTimeout(() => {
      toast.warning(`${removed} operação(ões) foram removidas por excesso de tentativas.`);
    }, 0);
  }

  const operations = getPendingOperations();
  
  if (operations.length === 0) {
    setTimeout(() => {
      toast.info('Nenhuma operação pendente para sincronizar.');
    }, 0);
    return result;
  }

  setTimeout(() => {
    toast.info(`Sincronizando ${operations.length} operação(ões)...`);
  }, 0);

  // Processar operações em ordem (FIFO)
  for (const operation of operations) {
    try {
      const success = await syncOperation(operation);
      
      if (success) {
        removeOperation(operation.id);
        result.success++;
      } else {
        incrementRetry(operation.id);
        result.failed++;
        result.errors.push({
          operation,
          error: new Error('Operação falhou sem erro específico'),
        });
      }
    } catch (error: any) {
      incrementRetry(operation.id);
      result.failed++;
      result.errors.push({ operation, error });
      
      // Log do erro para debug
      console.error(`Erro ao sincronizar operação ${operation.id}:`, error);
    }
  }

  // Feedback ao usuário (usar setTimeout para evitar problemas de hidratação)
  setTimeout(() => {
    if (result.success > 0 && result.failed === 0) {
      toast.success(`${result.success} operação(ões) sincronizada(s) com sucesso!`);
    } else if (result.success > 0 && result.failed > 0) {
      toast.warning(
        `${result.success} operação(ões) sincronizada(s), ${result.failed} falharam.`
      );
    } else if (result.failed > 0) {
      toast.error(`Falha ao sincronizar ${result.failed} operação(ões). Tente novamente.`);
    }
  }, 0);

  return result;
}

/**
 * Verifica se há operações pendentes
 */
export function hasPendingOperations(): boolean {
  return getPendingOperations().length > 0;
}

/**
 * Obtém o número de operações pendentes
 */
export function getPendingOperationsCount(): number {
  return getPendingOperations().length;
}

