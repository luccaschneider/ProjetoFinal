package com.microsservicos.back.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import com.microsservicos.back.service.UserLogService;
import com.microsservicos.back.util.SessionUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificados", description = "Endpoints para geração, download e validação de certificados de eventos")
public class CertificateController {

    private final RestTemplate restTemplate;
    private final UserLogService userLogService;
    private final SessionUtils sessionUtils;
    
    @Value("${certificate.service.url:http://localhost:3001}")
    private String certificateServiceUrl;

    @PostMapping("/generate")
    @Operation(
        summary = "Gera um novo certificado",
        description = "Gera um certificado PDF para um usuário com presença confirmada em um evento. " +
                     "Requer autenticação JWT e presença confirmada no evento."
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        description = "Dados para geração do certificado",
        required = true,
        content = @Content(schema = @Schema(implementation = GenerateCertificateRequest.class))
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Certificado gerado com sucesso",
            content = @Content(schema = @Schema(example = "{\"certificateCode\":\"CERT-2024-001234\",\"downloadUrl\":\"/api/certificates/download/CERT-2024-001234\"}"))),
        @ApiResponse(responseCode = "400", description = "Erro na requisição (presença não confirmada, etc.)"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> generateCertificate(@RequestBody @Valid GenerateCertificateRequest request) {
        HttpHeaders headers = new HttpHeaders();
        String authHeader = getCurrentRequest().getHeader("Authorization");
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<GenerateCertificateRequest> entity = new HttpEntity<>(request, headers);
        
        try {
            ResponseEntity<?> response = restTemplate.exchange(
                certificateServiceUrl + "/api/certificates/generate",
                HttpMethod.POST,
                entity,
                Object.class
            );
            
            // Log de auditoria
            if (response.getStatusCode().is2xxSuccessful()) {
                var usuario = sessionUtils.getUsuarioLogado();
                Map<String, Object> details = new HashMap<>();
                details.put("eventId", request.getEventId().toString());
                details.put("usuarioId", request.getUsuarioId().toString());
                if (response.getBody() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> body = (Map<String, Object>) response.getBody();
                    if (body.containsKey("certificateCode")) {
                        details.put("certificateCode", body.get("certificateCode"));
                        userLogService.logAction(usuario, "CERTIFICATE_GENERATE", "CERTIFICATE", 
                            null, details, getCurrentRequest());
                    }
                }
            }
            
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\":\"Erro ao comunicar com serviço de certificados: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/download/{code}")
    @Operation(
        summary = "Download do PDF do certificado",
        description = "Retorna o PDF do certificado para download. Requer autenticação JWT."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF do certificado",
            content = @Content(mediaType = "application/pdf")),
        @ApiResponse(responseCode = "404", description = "Certificado não encontrado"),
        @ApiResponse(responseCode = "401", description = "Não autenticado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<?> downloadCertificate(@PathVariable String code) {
        HttpHeaders headers = new HttpHeaders();
        String authHeader = getCurrentRequest().getHeader("Authorization");
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                certificateServiceUrl + "/api/certificates/download/" + code,
                HttpMethod.GET,
                entity,
                byte[].class
            );
            
            // Log de auditoria
            if (response.getStatusCode().is2xxSuccessful()) {
                var usuario = sessionUtils.getUsuarioLogado();
                Map<String, Object> details = new HashMap<>();
                details.put("certificateCode", code);
                userLogService.logAction(usuario, "CERTIFICATE_DOWNLOAD", "CERTIFICATE", null, details, getCurrentRequest());
            }
            
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_PDF);
            responseHeaders.setContentDispositionFormData("attachment", "certificado-" + code + ".pdf");
            
            return ResponseEntity.ok()
                .headers(responseHeaders)
                .body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\":\"Erro ao comunicar com serviço de certificados: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/validate/{code}")
    @Operation(
        summary = "Valida um certificado (público)",
        description = "Endpoint público para validar a autenticidade de um certificado através do código. " +
                     "Não requer autenticação."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resultado da validação",
            content = @Content(schema = @Schema(example = "{\"valid\":true,\"certificate\":{\"code\":\"CERT-2024-001234\",\"usuarioName\":\"João Silva\",\"eventName\":\"Workshop de Spring Boot\",\"eventDate\":\"2024-01-15T10:00:00\",\"issuedAt\":\"2024-01-16T10:30:00\"}}"))),
        @ApiResponse(responseCode = "404", description = "Certificado não encontrado (inválido)")
    })
    public ResponseEntity<?> validateCertificate(@PathVariable String code) {
        try {
            ResponseEntity<?> response = restTemplate.getForEntity(
                certificateServiceUrl + "/api/certificates/validate/" + code,
                Object.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"error\":\"Erro ao comunicar com serviço de certificados: " + e.getMessage() + "\"}");
        }
    }

    private jakarta.servlet.http.HttpServletRequest getCurrentRequest() {
        org.springframework.web.context.request.RequestAttributes requestAttributes = 
            org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (requestAttributes instanceof org.springframework.web.context.request.ServletRequestAttributes) {
            return ((org.springframework.web.context.request.ServletRequestAttributes) requestAttributes)
                .getRequest();
        }
        return null;
    }
    
    // Classe para o request body
    @Schema(description = "Request para geração de certificado")
    public static class GenerateCertificateRequest {
        @NotNull(message = "eventId é obrigatório")
        @Schema(description = "ID do evento", example = "550e8400-e29b-41d4-a716-446655440000", requiredMode = Schema.RequiredMode.REQUIRED)
        private UUID eventId;
        
        @NotNull(message = "usuarioId é obrigatório")
        @Schema(description = "ID do usuário", example = "550e8400-e29b-41d4-a716-446655440000", requiredMode = Schema.RequiredMode.REQUIRED)
        private UUID usuarioId;

        public UUID getEventId() {
            return eventId;
        }

        public void setEventId(UUID eventId) {
            this.eventId = eventId;
        }

        public UUID getUsuarioId() {
            return usuarioId;
        }

        public void setUsuarioId(UUID usuarioId) {
            this.usuarioId = usuarioId;
        }
    }

}

