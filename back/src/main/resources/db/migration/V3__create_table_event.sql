CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    detalhes TEXT,
    data_hora_inicio TIMESTAMP NOT NULL,
    data_hora_fim TIMESTAMP NOT NULL,
    local_evento VARCHAR(255),
    categoria VARCHAR(100),
    capacidade_maxima INTEGER,
    preco_ingresso DECIMAL(10, 2),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_ativo ON event(ativo);
CREATE INDEX idx_event_data_hora_inicio ON event(data_hora_inicio);
CREATE INDEX idx_event_categoria ON event(categoria);
CREATE INDEX idx_event_ativo_data_inicio ON event(ativo, data_hora_inicio);

