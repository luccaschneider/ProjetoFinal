package com.microsservicos.back.dto;

import com.microsservicos.back.validation.CpfCnpj;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para cadastro de novo usuário")
public class CadastroUsuarioDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 255, message = "Nome deve ter entre 2 e 255 caracteres")
    @Schema(description = "Nome completo do usuário", example = "João Silva")
    private String name;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email deve ser válido")
    @Schema(description = "Email do usuário", example = "joao@example.com")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    @Schema(description = "Senha do usuário", example = "senha123")
    private String password;

    @Schema(description = "Telefone do usuário (opcional). Pode ser enviado com formatação, mas será salvo apenas com números", example = "(11) 99999-9999")
    private String telefone;

    @CpfCnpj
    @Schema(description = "CPF ou CNPJ do usuário (opcional). Pode ser enviado com formatação, mas será salvo apenas com números", example = "123.456.789-00")
    private String documento;
}

