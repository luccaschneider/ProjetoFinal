export type OperationType = 'CADASTRO_RAPIDO' | 'INSCRICAO' | 'PRESENCA';

export interface PendingOperation {
  id: string;
  type: OperationType;
  data: any;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

/**
 * Gera um ID único para a operação
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtém todas as operações pendentes
 */
export function getPendingOperations(): PendingOperation[] {
  try {
    if (typeof window === 'undefined' || !localStorage) {
      return [];
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as PendingOperation[];
  } catch (error) {
    console.error('Erro ao ler operações pendentes:', error);
    return [];
  }
}

/**
 * Salva uma operação pendente
 */
export function saveOperation(
  type: OperationType,
  data: any
): PendingOperation {
  const operations = getPendingOperations();
  const operation: PendingOperation = {
    id: generateId(),
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  operations.push(operation);
  
  try {
    if (typeof window === 'undefined' || !localStorage) {
      throw new Error('localStorage não disponível');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('Erro ao salvar operação pendente:', error);
    throw error;
  }

  return operation;
}

/**
 * Remove uma operação pendente
 */
export function removeOperation(id: string): boolean {
  try {
    const operations = getPendingOperations();
    const filtered = operations.filter((op) => op.id !== id);
    
    if (filtered.length === operations.length) {
      return false; // Operação não encontrada
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Erro ao remover operação pendente:', error);
    return false;
  }
}

/**
 * Incrementa o contador de tentativas de uma operação
 */
export function incrementRetry(id: string): boolean {
  try {
    const operations = getPendingOperations();
    const operation = operations.find((op) => op.id === id);
    
    if (!operation) {
      return false;
    }

    operation.retries += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    return true;
  } catch (error) {
    console.error('Erro ao incrementar tentativa:', error);
    return false;
  }
}

/**
 * Remove operações que excederam o número máximo de tentativas
 */
export function removeMaxRetriesOperations(): number {
  try {
    const operations = getPendingOperations();
    const valid = operations.filter((op) => op.retries < MAX_RETRIES);
    const removed = operations.length - valid.length;

    if (removed > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return removed;
  } catch (error) {
    console.error('Erro ao remover operações com muitas tentativas:', error);
    return 0;
  }
}

/**
 * Limpa todas as operações pendentes
 */
export function clearAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar operações pendentes:', error);
  }
}

/**
 * Obtém o número de operações pendentes
 */
export function getPendingCount(): number {
  return getPendingOperations().length;
}

/**
 * Obtém operações pendentes por tipo
 */
export function getPendingOperationsByType(type: OperationType): PendingOperation[] {
  return getPendingOperations().filter((op) => op.type === type);
}

