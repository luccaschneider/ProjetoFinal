package com.microsservicos.back.service;

import com.microsservicos.back.domain.Event;
import com.microsservicos.back.domain.EventAttendance;
import com.microsservicos.back.domain.EventInscription;
import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.CadastroRapidoUsuarioDTO;
import com.microsservicos.back.dto.EventoInscritoDTO;
import com.microsservicos.back.dto.RegistrarPresencaDTO;
import com.microsservicos.back.dto.UsuarioResponseDTO;
import com.microsservicos.back.dto.UsuarioInscritoDTO;
import com.microsservicos.back.repository.EventAttendanceRepository;
import com.microsservicos.back.repository.EventInscriptionRepository;
import com.microsservicos.back.repository.EventRepository;
import com.microsservicos.back.repository.UsuarioRepository;
import com.microsservicos.back.util.SessionUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventAttendanceService {

    private final UsuarioRepository usuarioRepository;
    private final EventRepository eventRepository;
    private final EventInscriptionRepository eventInscriptionRepository;
    private final EventAttendanceRepository eventAttendanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioService usuarioService;
    private final SessionUtils sessionUtils;

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll().stream()
                .filter(Usuario::getAtivo)
                .collect(Collectors.toList());
        
        return usuarios.stream()
                .map(usuarioService::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventoInscritoDTO> listarEventosInscritosDoUsuario(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        List<EventInscription> inscriptions = eventInscriptionRepository.findByUsuario(usuario);
        
        return inscriptions.stream()
                .map(inscription -> {
                    Event event = inscription.getEvent();
                    
                    // Buscar registro de presença se existir
                    EventAttendance attendance = eventAttendanceRepository
                            .findByUsuarioAndEvent(usuario, event)
                            .orElse(null);
                    
                    return EventoInscritoDTO.builder()
                            .eventId(event.getId())
                            .nome(event.getNome())
                            .dataHoraInicio(event.getDataHoraInicio())
                            .dataHoraFim(event.getDataHoraFim())
                            .localEvento(event.getLocalEvento())
                            .categoria(event.getCategoria())
                            .presente(attendance != null ? attendance.getPresente() : false)
                            .confirmedAt(attendance != null ? attendance.getConfirmedAt() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioInscritoDTO> listarUsuariosInscritosNoEvento(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        
        List<EventInscription> inscriptions = eventInscriptionRepository.findByEvent(event);
        
        return inscriptions.stream()
                .map(inscription -> {
                    Usuario usuario = inscription.getUsuario();
                    
                    // Buscar registro de presença se existir
                    EventAttendance attendance = eventAttendanceRepository
                            .findByUsuarioAndEvent(usuario, event)
                            .orElse(null);
                    
                    return UsuarioInscritoDTO.builder()
                            .usuarioId(usuario.getId())
                            .nome(usuario.getName())
                            .email(usuario.getEmail())
                            .telefone(usuario.getTelefone())
                            .presente(attendance != null ? attendance.getPresente() : false)
                            .confirmedAt(attendance != null ? attendance.getConfirmedAt() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public EventoInscritoDTO registrarPresenca(RegistrarPresencaDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        
        // Verificar se o usuário está inscrito no evento
        eventInscriptionRepository
                .findByUsuarioAndEvent(usuario, event)
                .orElseThrow(() -> new RuntimeException("Usuário não está inscrito neste evento"));
        
        // Buscar ou criar registro de presença
        EventAttendance attendance = eventAttendanceRepository
                .findByUsuarioAndEvent(usuario, event)
                .orElse(EventAttendance.builder()
                        .usuario(usuario)
                        .event(event)
                        .presente(false)
                        .build());
        
        // Atualizar presença
        attendance.setPresente(dto.getPresente() != null ? dto.getPresente() : true);
        
        // Se está marcando como presente, registrar quem confirmou e quando
        if (attendance.getPresente()) {
            Usuario admin = sessionUtils.getUsuarioLogado();
            attendance.setConfirmadoPor(admin.getId());
            attendance.setConfirmedAt(LocalDateTime.now());
        } else {
            // Se está removendo a presença, limpar os campos
            attendance.setConfirmadoPor(null);
            attendance.setConfirmedAt(null);
        }
        
        attendance = eventAttendanceRepository.save(attendance);
        
        // Retornar DTO com informações atualizadas
        return EventoInscritoDTO.builder()
                .eventId(event.getId())
                .nome(event.getNome())
                .dataHoraInicio(event.getDataHoraInicio())
                .dataHoraFim(event.getDataHoraFim())
                .localEvento(event.getLocalEvento())
                .categoria(event.getCategoria())
                .presente(attendance.getPresente())
                .confirmedAt(attendance.getConfirmedAt())
                .build();
    }

    @Transactional
    public UsuarioResponseDTO cadastrarUsuarioEConfirmarPresenca(CadastroRapidoUsuarioDTO dto) {
        // Verificar se o email já existe
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }
        
        // Verificar se o evento existe
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        
        // Criar usuário com senha temporária
        Usuario usuario = Usuario.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode("senhatemporaria"))
                .ativo(true)
                .build();
        
        usuario = usuarioRepository.save(usuario);
        
        // Inscrever no evento
        EventInscription inscription = EventInscription.builder()
                .usuario(usuario)
                .event(event)
                .build();
        eventInscriptionRepository.save(inscription);
        
        // Marcar presença automaticamente
        Usuario admin = sessionUtils.getUsuarioLogado();
        EventAttendance attendance = EventAttendance.builder()
                .usuario(usuario)
                .event(event)
                .presente(true)
                .confirmadoPor(admin.getId())
                .confirmedAt(LocalDateTime.now())
                .build();
        eventAttendanceRepository.save(attendance);
        
        return usuarioService.toResponseDTO(usuario);
    }
}
