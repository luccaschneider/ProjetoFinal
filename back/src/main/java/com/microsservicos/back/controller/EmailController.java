package com.microsservicos.back.controller;

import com.microsservicos.back.domain.Event;
import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.EnviarEmailCertificadoDTO;
import com.microsservicos.back.repository.EventRepository;
import com.microsservicos.back.repository.UsuarioRepository;
import com.microsservicos.back.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@Tag(name = "Emails", description = "Endpoints para envio de emails (uso interno)")
public class EmailController {

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;
    private final EventRepository eventRepository;

    @PostMapping("/certificado")
    @Operation(
        summary = "Enviar email de certificado emitido",
        description = "Endpoint interno para envio de email quando um certificado é emitido. " +
                     "Usado pelo serviço de certificados (Node.js)."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Email enviado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou usuário/evento não encontrado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> enviarEmailCertificado(@Valid @RequestBody EnviarEmailCertificadoDTO dto) {
        try {
            Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
            
            Event event = eventRepository.findById(dto.getEventId())
                    .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
            
            emailService.enviarEmailCertificadoEmitido(usuario, event, dto.getCertificateCode());
            
            return ResponseEntity.ok().body("{\"message\":\"Email enviado com sucesso\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\":\"Erro ao enviar email: " + e.getMessage() + "\"}");
        }
    }
}

