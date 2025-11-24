-- Adiciona coluna role na tabela usuario
ALTER TABLE usuario ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Cria índice para melhor performance em consultas por role
CREATE INDEX idx_usuario_role ON usuario(role);


