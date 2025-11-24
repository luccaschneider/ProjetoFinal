package com.microsservicos.back.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para registrar presença de um usuário em um evento")
public class RegistrarPresencaDTO {

    @NotNull(message = "ID do usuário é obrigatório")
    @Schema(description = "ID do usuário", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID usuarioId;

    @NotNull(message = "ID do evento é obrigatório")
    @Schema(description = "ID do evento", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID eventId;

    @Schema(description = "Se o usuário está presente (default: true)", example = "true")
    private Boolean presente = true;
}


