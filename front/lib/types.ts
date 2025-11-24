export interface LoginDTO {
  email: string;
  password: string;
}

export interface CadastroUsuarioDTO {
  name: string;
  email: string;
  password: string;
  telefone?: string;
  documento?: string;
}

export interface UpdateProfileDTO {
  name?: string;
  telefone?: string;
  documento?: string;
}

export interface LoginResponseDTO {
  token: string;
  tokenType: string;
  id: string;
  name: string;
  email: string;
  telefone?: string;
  documento?: string;
  ativo: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioResponseDTO {
  id: string;
  name: string;
  email: string;
  telefone?: string;
  documento?: string;
  ativo: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface EventResponseDTO {
  id: string;
  nome: string;
  detalhes?: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  localEvento?: string;
  categoria?: string;
  capacidadeMaxima?: number;
  precoIngresso?: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventoInscritoDTO {
  eventId: string;
  nome: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  localEvento?: string;
  categoria?: string;
  presente: boolean;
  confirmedAt?: string;
}

export interface UserLogDTO {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface UsuarioInscritoDTO {
  usuarioId: string;
  nome: string;
  email: string;
  telefone?: string;
  presente: boolean;
  confirmedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

