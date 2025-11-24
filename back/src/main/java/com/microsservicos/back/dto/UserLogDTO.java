package com.microsservicos.back.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO de resposta para log de auditoria do usuário")
public class UserLogDTO {

    @Schema(description = "ID do log", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    @Schema(description = "Ação realizada", example = "LOGIN")
    private String action;

    @Schema(description = "Tipo da entidade afetada", example = "EVENT")
    private String entityType;

    @Schema(description = "ID da entidade afetada", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID entityId;

    @Schema(description = "Detalhes adicionais da ação")
    private Map<String, Object> details;

    @Schema(description = "Endereço IP de origem")
    private String ipAddress;

    @Schema(description = "User agent do navegador")
    private String userAgent;

    @Schema(description = "Data e hora da ação")
    private LocalDateTime createdAt;
}

