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
@Schema(description = "DTO para usuário inscrito em evento com informação de presença")
public class UsuarioInscritoDTO {

    @Schema(description = "ID do usuário")
    private UUID usuarioId;

    @Schema(description = "Nome do usuário")
    private String nome;

    @Schema(description = "Email do usuário")
    private String email;

    @Schema(description = "Telefone do usuário")
    private String telefone;

    @Schema(description = "Se o usuário está presente")
    private Boolean presente;

    @Schema(description = "Data de confirmação de presença")
    private LocalDateTime confirmedAt;
}

