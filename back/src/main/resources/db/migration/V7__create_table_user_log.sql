-- Migration: Criar tabela de logs de auditoria
-- Descrição: Tabela para armazenar logs de todas as ações dos usuários para auditoria

CREATE TABLE IF NOT EXISTS user_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_user_log_usuario ON user_log(usuario_id);
CREATE INDEX idx_user_log_created_at ON user_log(created_at);
CREATE INDEX idx_user_log_action ON user_log(action);
CREATE INDEX idx_user_log_entity ON user_log(entity_type, entity_id);

-- Comentários nas colunas
COMMENT ON TABLE user_log IS 'Tabela de logs de auditoria para rastrear ações dos usuários';
COMMENT ON COLUMN user_log.usuario_id IS 'Referência ao usuário que realizou a ação';
COMMENT ON COLUMN user_log.action IS 'Tipo de ação realizada (ex: LOGIN, EVENT_INSCRIPTION, etc)';
COMMENT ON COLUMN user_log.entity_type IS 'Tipo da entidade afetada (ex: EVENT, CERTIFICATE, etc)';
COMMENT ON COLUMN user_log.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN user_log.details IS 'Detalhes adicionais da ação em formato JSON';
COMMENT ON COLUMN user_log.ip_address IS 'Endereço IP de onde a ação foi realizada';
COMMENT ON COLUMN user_log.user_agent IS 'User agent do navegador/cliente';

