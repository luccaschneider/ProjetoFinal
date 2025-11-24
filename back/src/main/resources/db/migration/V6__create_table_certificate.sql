-- Migration: Criar tabela de certificados
-- Descrição: Tabela para armazenar certificados emitidos para participantes com presença confirmada

CREATE TABLE IF NOT EXISTS certificate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_code VARCHAR(20) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL,
    event_id UUID NOT NULL,
    event_attendance_id UUID NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_certificate_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificate_event FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificate_attendance FOREIGN KEY (event_attendance_id) REFERENCES event_attendance(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_certificate_code ON certificate(certificate_code);
CREATE INDEX idx_certificate_usuario ON certificate(usuario_id);
CREATE INDEX idx_certificate_event ON certificate(event_id);
CREATE INDEX idx_certificate_attendance ON certificate(event_attendance_id);

-- Comentários nas colunas
COMMENT ON TABLE certificate IS 'Tabela de certificados emitidos para participantes com presença confirmada';
COMMENT ON COLUMN certificate.certificate_code IS 'Código único do certificado no formato CERT-YYYY-NNNNNN';
COMMENT ON COLUMN certificate.usuario_id IS 'Referência ao usuário que recebeu o certificado';
COMMENT ON COLUMN certificate.event_id IS 'Referência ao evento do certificado';
COMMENT ON COLUMN certificate.event_attendance_id IS 'Referência ao registro de presença que gerou o certificado';
COMMENT ON COLUMN certificate.issued_at IS 'Data e hora de emissão do certificado';

