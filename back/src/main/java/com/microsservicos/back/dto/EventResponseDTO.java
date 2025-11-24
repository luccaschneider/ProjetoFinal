package com.microsservicos.back.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO de resposta com informações do evento")
public class EventResponseDTO {

    @Schema(description = "ID único do evento", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    @Schema(description = "Nome do evento", example = "Peça de Teatro: Hamlet")
    private String nome;

    @Schema(description = "Detalhes e descrição do evento", example = "Apresentação clássica da obra de Shakespeare")
    private String detalhes;

    @Schema(description = "Data e hora de início do evento")
    private LocalDateTime dataHoraInicio;

    @Schema(description = "Data e hora de término do evento")
    private LocalDateTime dataHoraFim;

    @Schema(description = "Local onde o evento será realizado", example = "Teatro Municipal")
    private String localEvento;

    @Schema(description = "Categoria do evento", example = "Teatro")
    private String categoria;

    @Schema(description = "Capacidade máxima de público", example = "500")
    private Integer capacidadeMaxima;

    @Schema(description = "Preço do ingresso", example = "50.00")
    private BigDecimal precoIngresso;

    @Schema(description = "Indica se o evento está ativo", example = "true")
    private Boolean ativo;

    @Schema(description = "Data de criação do evento")
    private LocalDateTime createdAt;

    @Schema(description = "Data da última atualização do evento")
    private LocalDateTime updatedAt;
}

