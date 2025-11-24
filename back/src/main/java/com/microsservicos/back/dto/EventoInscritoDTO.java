package com.microsservicos.back.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para evento inscrito com informação de presença")
public class EventoInscritoDTO {

    @Schema(description = "ID do evento")
    private UUID eventId;

    @Schema(description = "Nome do evento")
    private String nome;

    @Schema(description = "Data e hora de início")
    private LocalDateTime dataHoraInicio;

    @Schema(description = "Data e hora de fim")
    private LocalDateTime dataHoraFim;

    @Schema(description = "Local do evento")
    private String localEvento;

    @Schema(description = "Categoria do evento")
    private String categoria;

    @Schema(description = "Se o usuário está presente")
    private Boolean presente;

    @Schema(description = "Data de confirmação de presença")
    private LocalDateTime confirmedAt;
}

