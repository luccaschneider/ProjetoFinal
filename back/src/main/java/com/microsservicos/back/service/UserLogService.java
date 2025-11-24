package com.microsservicos.back.service;

import com.microsservicos.back.domain.UserLog;
import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.UserLogDTO;
import com.microsservicos.back.repository.UserLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserLogService {

    private final UserLogRepository userLogRepository;

    /**
     * Registra uma ação do usuário de forma assíncrona
     */
    @Async
    @Transactional
    public void logAction(Usuario usuario, String action, String entityType, UUID entityId, 
                         Map<String, Object> details, HttpServletRequest request) {
        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            UserLog userLog = UserLog.builder()
                    .usuario(usuario)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details != null ? details : new HashMap<>())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            userLogRepository.save(userLog);
        } catch (Exception e) {
            log.error("Erro ao salvar log de auditoria: {}", e.getMessage(), e);
            // Não lançar exceção para não interromper o fluxo principal
        }
    }

    /**
     * Versão simplificada sem HttpServletRequest
     */
    @Async
    @Transactional
    public void logAction(Usuario usuario, String action, String entityType, UUID entityId, 
                         Map<String, Object> details) {
        logAction(usuario, action, entityType, entityId, details, null);
    }

    /**
     * Lista logs do usuário logado
     */
    @Transactional(readOnly = true)
    public Page<UserLogDTO> listarLogsDoUsuario(Usuario usuario, Pageable pageable) {
        Page<UserLog> logs = userLogRepository.findByUsuarioOrderByCreatedAtDesc(usuario, pageable);
        return logs.map(this::toDTO);
    }

    /**
     * Lista logs do usuário filtrados por ação
     */
    @Transactional(readOnly = true)
    public Page<UserLogDTO> listarLogsDoUsuarioPorAcao(Usuario usuario, String action, Pageable pageable) {
        Page<UserLog> logs = userLogRepository.findByUsuarioAndActionOrderByCreatedAtDesc(usuario, action, pageable);
        return logs.map(this::toDTO);
    }

    private UserLogDTO toDTO(UserLog log) {
        return UserLogDTO.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }

    /**
     * Obtém o endereço IP real do cliente
     */
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // Se houver múltiplos IPs, pegar o primeiro
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }
}

