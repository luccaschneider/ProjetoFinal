package com.microsservicos.back.controller;

import com.microsservicos.back.dto.UserLogDTO;
import com.microsservicos.back.service.UserLogService;
import com.microsservicos.back.util.SessionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@Tag(name = "Logs de Auditoria", description = "Endpoints para consultar logs de auditoria do usuário")
@SecurityRequirement(name = "bearerAuth")
public class UserLogController {

    private final UserLogService userLogService;
    private final SessionUtils sessionUtils;

    @GetMapping("/my-logs")
    @Operation(
        summary = "Listar logs do usuário logado",
        description = "Retorna uma lista paginada de logs de auditoria do usuário autenticado. " +
                     "Cada usuário só pode ver seus próprios logs."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de logs retornada com sucesso",
            content = @Content(schema = @Schema(implementation = UserLogDTO.class))),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Page<UserLogDTO>> listarMeusLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action) {
        
        var usuario = sessionUtils.getUsuarioLogado();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<UserLogDTO> logs;
        if (action != null && !action.isEmpty()) {
            logs = userLogService.listarLogsDoUsuarioPorAcao(usuario, action, pageable);
        } else {
            logs = userLogService.listarLogsDoUsuario(usuario, pageable);
        }
        
        return ResponseEntity.ok(logs);
    }
}

