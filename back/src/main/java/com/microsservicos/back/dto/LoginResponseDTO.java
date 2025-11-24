package com.microsservicos.back.dto;

import com.microsservicos.back.domain.Role;
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
@Schema(description = "DTO de resposta do login com token JWT e informações do usuário")
public class LoginResponseDTO {

    @Schema(description = "Token JWT para autenticação", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;

    @Schema(description = "Tipo do token", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "ID único do usuário", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    @Schema(description = "Nome completo do usuário", example = "João Silva")
    private String name;

    @Schema(description = "Email do usuário", example = "joao@example.com")
    private String email;

    @Schema(description = "Telefone do usuário", example = "(11) 99999-9999")
    private String telefone;

    @Schema(description = "CPF ou CNPJ do usuário (salvo sem formatação)", example = "12345678900")
    private String documento;

    @Schema(description = "Indica se o usuário está ativo", example = "true")
    private Boolean ativo;

    @Schema(description = "Role do usuário (USER ou ADMIN)", example = "USER")
    private Role role;

    @Schema(description = "Data de criação do usuário")
    private LocalDateTime createdAt;

    @Schema(description = "Data da última atualização do usuário")
    private LocalDateTime updatedAt;
}

