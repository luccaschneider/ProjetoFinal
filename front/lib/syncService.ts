import { getPendingOperations, removeOperation, incrementRetry, removeMaxRetriesOperations, type PendingOperation } from './offlineStorage';
import { adminApi, inscriptionApi } from './api';
import { setCache, removeCache } from './cacheService';
import { toast } from 'sonner';

export interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ operation: PendingOperation; error: any }>;
}

/**
 * Sincroniza uma operação de cadastro rápido
 */
async function syncCadastroRapido(operation: PendingOperation): Promise<boolean> {
  try {
    const result = await adminApi.cadastroRapido(operation.data);
    
    // Atualizar cache de usuários
    removeCache('usuarios');
    
    // Se houver eventId, atualizar cache de inscrições e presenças
    if (operation.data.eventId) {
      removeCache(`inscriptions`);
      removeCache(`presences_${operation.data.eventId}`);
    }
    
    return true;
  } catch (error: any) {
    // Se o erro for que o usuário já existe, considerar sucesso
    if (error.response?.status === 400 && error.response?.data?.message?.includes('já cadastrado')) {
      return true;
    }
    throw error;
  }
}

/**
 * Sincroniza uma operação de inscrição
 */
async function syncInscricao(operation: PendingOperation): Promise<boolean> {
  try {
    await inscriptionApi.inscrever(operation.data.eventId);
    
    // Atualizar cache de inscrições
    removeCache('inscriptions');
    removeCache(`event_${operation.data.eventId}`);
    
    return true;
  } catch (error: any) {
    // Se o erro for que já está inscrito, considerar sucesso
    if (error.response?.status === 400 && error.response?.data?.message?.includes('já inscrito')) {
      return true;
    }
    throw error;
  }
}

/**
 * Sincroniza uma operação de presença
 */
async function syncPresenca(operation: PendingOperation): Promise<boolean> {
  try {
    await adminApi.registrarPresenca(operation.data);
    
    // Atualizar cache de presenças
    removeCache(`presences_${operation.data.eventId}`);
    removeCache(`usuarios_inscritos_${operation.data.eventId}`);
    
    return true;
  } catch (error: any) {
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

  // Verificar se está online
  if (!navigator.onLine) {
    toast.error('Sem conexão com a internet. Conecte-se para sincronizar.');
    return result;
  }

  // Remover operações que excederam tentativas
  const removed = removeMaxRetriesOperations();
  if (removed > 0) {
    toast.warning(`${removed} operação(ões) foram removidas por excesso de tentativas.`);
  }

  const operations = getPendingOperations();
  
  if (operations.length === 0) {
    toast.info('Nenhuma operação pendente para sincronizar.');
    return result;
  }

  toast.info(`Sincronizando ${operations.length} operação(ões)...`);

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

  // Feedback ao usuário
  if (result.success > 0 && result.failed === 0) {
    toast.success(`${result.success} operação(ões) sincronizada(s) com sucesso!`);
  } else if (result.success > 0 && result.failed > 0) {
    toast.warning(
      `${result.success} operação(ões) sincronizada(s), ${result.failed} falharam.`
    );
  } else if (result.failed > 0) {
    toast.error(`Falha ao sincronizar ${result.failed} operação(ões). Tente novamente.`);
  }

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

