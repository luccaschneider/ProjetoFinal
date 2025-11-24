CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    event_id UUID NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT false,
    confirmado_por UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    CONSTRAINT fk_event_attendance_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_attendance_event FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    CONSTRAINT uk_event_attendance_usuario_event UNIQUE (usuario_id, event_id)
);

CREATE INDEX idx_event_attendance_usuario ON event_attendance(usuario_id);
CREATE INDEX idx_event_attendance_event ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_presente ON event_attendance(presente);



