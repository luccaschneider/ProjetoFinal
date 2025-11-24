package com.microsservicos.back.controller;

import com.microsservicos.back.dto.EventResponseDTO;
import com.microsservicos.back.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Eventos", description = "Endpoints para consulta de eventos (público)")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Listar todos os eventos ativos", description = "Retorna uma lista de todos os eventos ativos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de eventos retornada com sucesso",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EventResponseDTO>> listarTodos() {
        List<EventResponseDTO> eventos = eventService.listarTodos();
        return ResponseEntity.ok(eventos);
    }

    @GetMapping("/proximos")
    @Operation(summary = "Listar próximos eventos", description = "Retorna uma lista de eventos futuros que ainda não aconteceram")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de próximos eventos retornada com sucesso",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EventResponseDTO>> listarProximos() {
        List<EventResponseDTO> eventos = eventService.listarProximos();
        return ResponseEntity.ok(eventos);
    }

    @GetMapping("/categoria/{categoria}")
    @Operation(summary = "Listar eventos por categoria", description = "Retorna uma lista de eventos filtrados por categoria")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de eventos por categoria retornada com sucesso",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<EventResponseDTO>> listarPorCategoria(@PathVariable String categoria) {
        List<EventResponseDTO> eventos = eventService.listarPorCategoria(categoria);
        return ResponseEntity.ok(eventos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar evento por ID", description = "Retorna os detalhes de um evento específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Evento encontrado",
            content = @Content(schema = @Schema(implementation = EventResponseDTO.class))),
        @ApiResponse(responseCode = "404", description = "Evento não encontrado ou inativo"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<EventResponseDTO> buscarPorId(@PathVariable UUID id) {
        EventResponseDTO evento = eventService.buscarPorId(id);
        return ResponseEntity.ok(evento);
    }
}

