package com.microsservicos.back.controller;

import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.CadastroUsuarioDTO;
import com.microsservicos.back.dto.LoginDTO;
import com.microsservicos.back.dto.LoginResponseDTO;
import com.microsservicos.back.dto.UpdateProfileDTO;
import com.microsservicos.back.dto.UsuarioResponseDTO;
import com.microsservicos.back.repository.UsuarioRepository;
import com.microsservicos.back.service.AuthService;
import com.microsservicos.back.service.UserLogService;
import com.microsservicos.back.service.UsuarioService;
import com.microsservicos.back.util.SessionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints para autenticação e gerenciamento de usuários")
public class AuthController {

    private final UsuarioService usuarioService;
    private final AuthService authService;
    private final SessionUtils sessionUtils;
    private final UserLogService userLogService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/cadastro")
    @Operation(summary = "Cadastrar novo usuário", description = "Cria uma nova conta de usuário com os dados básicos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Usuário cadastrado com sucesso",
            content = @Content(schema = @Schema(implementation = UsuarioResponseDTO.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou email já cadastrado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<UsuarioResponseDTO> cadastrar(@Valid @RequestBody CadastroUsuarioDTO dto, 
                                                          HttpServletRequest request) {
        UsuarioResponseDTO usuarioResponse = usuarioService.cadastrar(dto);
        
        // Log de auditoria
        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail()).orElse(null);
        if (usuario != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("email", dto.getEmail());
            details.put("name", dto.getName());
            userLogService.logAction(usuario, "REGISTER", null, null, details, request);
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioResponse);
    }

    @PostMapping("/login")
    @Operation(summary = "Fazer login", description = "Autentica o usuário e retorna token JWT")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso",
            content = @Content(schema = @Schema(implementation = LoginResponseDTO.class))),
        @ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginDTO dto, 
                                                  HttpServletRequest request) {
        LoginResponseDTO loginResponse = authService.login(dto);
        
        // Log de auditoria
        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail()).orElse(null);
        if (usuario != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("email", dto.getEmail());
            userLogService.logAction(usuario, "LOGIN", null, null, details, request);
        }
        
        return ResponseEntity.ok(loginResponse);
    }

    @GetMapping("/me")
    @Operation(summary = "Obter usuário logado", description = "Retorna as informações do usuário autenticado (requer token JWT)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário encontrado",
            content = @Content(schema = @Schema(implementation = UsuarioResponseDTO.class))),
        @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<UsuarioResponseDTO> obterUsuarioLogado() {
        var usuario = sessionUtils.getUsuarioLogado();
        UsuarioResponseDTO usuarioResponse = usuarioService.toResponseDTO(usuario);
        return ResponseEntity.ok(usuarioResponse);
    }

    @PutMapping("/me")
    @Operation(summary = "Atualizar perfil do usuário logado", description = "Atualiza os dados do perfil do usuário autenticado (requer token JWT)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Perfil atualizado com sucesso",
            content = @Content(schema = @Schema(implementation = UsuarioResponseDTO.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Não autenticado")
    })
    public ResponseEntity<UsuarioResponseDTO> atualizarPerfil(@Valid @RequestBody UpdateProfileDTO dto,
                                                               HttpServletRequest request) {
        var usuario = sessionUtils.getUsuarioLogado();
        UsuarioResponseDTO usuarioResponse = usuarioService.atualizarPerfil(usuario, dto);
        
        // Log de auditoria
        Map<String, Object> details = new HashMap<>();
        if (dto.getName() != null) details.put("name", dto.getName());
        if (dto.getTelefone() != null) details.put("telefone", dto.getTelefone());
        if (dto.getDocumento() != null) details.put("documento", "***"); // Não logar documento completo por segurança
        userLogService.logAction(usuario, "PROFILE_UPDATE", null, null, details, request);
        
        return ResponseEntity.ok(usuarioResponse);
    }
}

