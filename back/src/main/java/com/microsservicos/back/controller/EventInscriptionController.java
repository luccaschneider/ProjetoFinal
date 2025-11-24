package com.microsservicos.back.controller;

import com.microsservicos.back.dto.EventResponseDTO;
import com.microsservicos.back.service.EventInscriptionService;
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
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Inscrições em Eventos", description = "Endpoints para gerenciar inscrições em eventos (requer autenticação)")
@SecurityRequirement(name = "bearerAuth")
public class EventInscriptionController {

    private final EventInscriptionService eventInscriptionService;
    private final UserLogService userLogService;
    private final SessionUtils sessionUtils;

    @PostMapping("/{eventId}/inscricao")
    @Operation(
        summary = "Inscrever-se em um evento",
        description = "Permite que o usuário autenticado se inscreva em um evento. O usuário é identificado automaticamente pela sessão."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Inscrição realizada com sucesso",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "400", description = "Erro na requisição (evento não encontrado, já inscrito, capacidade máxima atingida)"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<EventResponseDTO> inscreverEmEvento(@PathVariable UUID eventId, 
                                                                 HttpServletRequest request) {
        EventResponseDTO evento = eventInscriptionService.inscreverEmEvento(eventId);
        
        // Log de auditoria
        var usuario = sessionUtils.getUsuarioLogado();
        Map<String, Object> details = new HashMap<>();
        details.put("eventId", eventId.toString());
        details.put("eventName", evento.getNome());
        userLogService.logAction(usuario, "EVENT_INSCRIPTION", "EVENT", eventId, details, request);
        
        return ResponseEntity.ok(evento);
    }

    @GetMapping("/inscricoes")
    @Operation(
        summary = "Listar eventos inscritos",
        description = "Retorna a lista de eventos em que o usuário autenticado está inscrito. O usuário é identificado automaticamente pela sessão."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de eventos inscritos retornada com sucesso",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EventResponseDTO>> listarEventosInscritos() {
        List<EventResponseDTO> eventos = eventInscriptionService.listarEventosInscritos();
        return ResponseEntity.ok(eventos);
    }

    @DeleteMapping("/{eventId}/inscricao")
    @Operation(
        summary = "Cancelar inscrição em um evento",
        description = "Permite que o usuário autenticado cancele sua inscrição em um evento. O usuário é identificado automaticamente pela sessão."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Inscrição cancelada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Erro na requisição (evento não encontrado, inscrição não encontrada)"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Void> cancelarInscricao(@PathVariable UUID eventId, 
                                                   HttpServletRequest request) {
        eventInscriptionService.cancelarInscricao(eventId);
        
        // Log de auditoria
        var usuario = sessionUtils.getUsuarioLogado();
        Map<String, Object> details = new HashMap<>();
        details.put("eventId", eventId.toString());
        userLogService.logAction(usuario, "EVENT_UNINSCRIPTION", "EVENT", eventId, details, request);
        
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/presencas")
    @Operation(
        summary = "Listar eventos com presença confirmada",
        description = "Retorna a lista de eventos em que o usuário autenticado teve presença confirmada. " +
                     "O usuário é identificado automaticamente pela sessão."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de eventos com presença confirmada retornada com sucesso",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EventResponseDTO>> listarEventosComPresencaConfirmada() {
        List<EventResponseDTO> eventos = eventInscriptionService.listarEventosComPresencaConfirmada();
        return ResponseEntity.ok(eventos);
    }
}

