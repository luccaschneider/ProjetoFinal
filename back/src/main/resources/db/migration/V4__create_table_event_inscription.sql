CREATE TABLE event_inscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    event_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_inscription_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_inscription_event FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    CONSTRAINT uk_event_inscription_usuario_event UNIQUE (usuario_id, event_id)
);

CREATE INDEX idx_event_inscription_usuario ON event_inscription(usuario_id);
CREATE INDEX idx_event_inscription_event ON event_inscription(event_id);


