package com.microsservicos.back.controller;

import com.microsservicos.back.dto.CadastroRapidoUsuarioDTO;
import com.microsservicos.back.dto.EventoInscritoDTO;
import com.microsservicos.back.dto.RegistrarPresencaDTO;
import com.microsservicos.back.dto.UsuarioResponseDTO;
import com.microsservicos.back.dto.UsuarioInscritoDTO;
import com.microsservicos.back.service.EventAttendanceService;
import com.microsservicos.back.service.UserLogService;
import com.microsservicos.back.util.SessionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Gerenciamento de Presença (Admin)", description = "Endpoints para administradores gerenciarem presença em eventos")
@SecurityRequirement(name = "bearerAuth")
public class EventAttendanceController {

    private final EventAttendanceService eventAttendanceService;
    private final UserLogService userLogService;
    private final SessionUtils sessionUtils;

    @GetMapping("/usuarios")
    @Operation(
        summary = "Listar todos os usuários",
        description = "Retorna lista de todos os usuários ativos para o ADMIN selecionar"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de usuários retornada com sucesso",
            content = @Content(schema = @Schema(implementation = UsuarioResponseDTO.class))),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        List<UsuarioResponseDTO> usuarios = eventAttendanceService.listarUsuarios();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/usuarios/{usuarioId}/eventos-inscritos")
    @Operation(
        summary = "Listar eventos inscritos de um usuário",
        description = "Retorna a lista de eventos em que um usuário está inscrito, com informações de presença. " +
                     "Permite ao ADMIN verificar e registrar presença."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de eventos inscritos retornada com sucesso",
            content = @Content(schema = @Schema(implementation = EventoInscritoDTO.class))),
        @ApiResponse(responseCode = "400", description = "Usuário não encontrado"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EventoInscritoDTO>> listarEventosInscritosDoUsuario(
            @PathVariable UUID usuarioId) {
        List<EventoInscritoDTO> eventos = eventAttendanceService.listarEventosInscritosDoUsuario(usuarioId);
        return ResponseEntity.ok(eventos);
    }

    @PostMapping("/presenca")
    @Operation(
        summary = "Registrar presença de um usuário em um evento",
        description = "Permite ao ADMIN registrar presença de um usuário em um evento. " +
                     "O usuário deve estar inscrito no evento."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Presença registrada com sucesso",
            content = @Content(schema = @Schema(implementation = EventoInscritoDTO.class))),
        @ApiResponse(responseCode = "400", description = "Erro na requisição (usuário/evento não encontrado, usuário não inscrito)"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<EventoInscritoDTO> registrarPresenca(@Valid @RequestBody RegistrarPresencaDTO dto,
                                                                 HttpServletRequest request) {
        EventoInscritoDTO resultado = eventAttendanceService.registrarPresenca(dto);
        
        // Log de auditoria
        var admin = sessionUtils.getUsuarioLogado();
        Map<String, Object> details = new HashMap<>();
        details.put("eventId", dto.getEventId().toString());
        details.put("usuarioId", dto.getUsuarioId().toString());
        details.put("presente", dto.getPresente());
        userLogService.logAction(admin, "ATTENDANCE_REGISTER", "EVENT", dto.getEventId(), details, request);
        
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/eventos/{eventId}/usuarios-inscritos")
    @Operation(
        summary = "Listar usuários inscritos em um evento",
        description = "Retorna a lista de usuários inscritos em um evento específico, com informações de presença. " +
                     "Permite ao ADMIN verificar e registrar presença."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de usuários inscritos retornada com sucesso",
            content = @Content(schema = @Schema(implementation = UsuarioInscritoDTO.class))),
        @ApiResponse(responseCode = "400", description = "Evento não encontrado"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<UsuarioInscritoDTO>> listarUsuariosInscritosNoEvento(
            @PathVariable UUID eventId) {
        List<UsuarioInscritoDTO> usuarios = eventAttendanceService.listarUsuariosInscritosNoEvento(eventId);
        return ResponseEntity.ok(usuarios);
    }

    @PostMapping("/cadastro-rapido")
    @Operation(
        summary = "Cadastrar usuário, inscrever em evento e marcar presença",
        description = "Fluxo completo para atendente cadastrar uma pessoa que chegou no evento. " +
                     "Cria o usuário com senha temporária 'senhatemporaria', inscreve no evento e marca presença automaticamente."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário cadastrado, inscrito e presença confirmada com sucesso",
            content = @Content(schema = @Schema(implementation = UsuarioResponseDTO.class))),
        @ApiResponse(responseCode = "400", description = "Erro na requisição (email já cadastrado, evento não encontrado)"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - apenas ADMIN"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<UsuarioResponseDTO> cadastrarUsuarioEConfirmarPresenca(
            @Valid @RequestBody CadastroRapidoUsuarioDTO dto,
            HttpServletRequest request) {
        UsuarioResponseDTO usuario = eventAttendanceService.cadastrarUsuarioEConfirmarPresenca(dto);
        
        // Log de auditoria
        var admin = sessionUtils.getUsuarioLogado();
        Map<String, Object> details = new HashMap<>();
        details.put("eventId", dto.getEventId().toString());
        details.put("usuarioName", dto.getName());
        details.put("usuarioEmail", dto.getEmail());
        details.put("usuarioId", usuario.getId().toString());
        userLogService.logAction(admin, "QUICK_REGISTER", "EVENT", dto.getEventId(), details, request);
        
        return ResponseEntity.ok(usuario);
    }
}

