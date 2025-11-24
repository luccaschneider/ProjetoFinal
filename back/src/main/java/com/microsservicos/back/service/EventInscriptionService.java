package com.microsservicos.back.service;

import com.microsservicos.back.domain.Event;
import com.microsservicos.back.domain.EventAttendance;
import com.microsservicos.back.domain.EventInscription;
import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.EventResponseDTO;
import com.microsservicos.back.repository.EventAttendanceRepository;
import com.microsservicos.back.repository.EventInscriptionRepository;
import com.microsservicos.back.repository.EventRepository;
import com.microsservicos.back.util.SessionUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventInscriptionService {

    private final EventInscriptionRepository eventInscriptionRepository;
    private final EventRepository eventRepository;
    private final EventAttendanceRepository eventAttendanceRepository;
    private final SessionUtils sessionUtils;
    private final EventService eventService;
    private final EmailService emailService;

    @Transactional
    public EventResponseDTO inscreverEmEvento(UUID eventId) {
        Usuario usuario = sessionUtils.getUsuarioLogado();
        
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        
        if (!event.getAtivo()) {
            throw new RuntimeException("Evento não está ativo");
        }
        
        // Verificar se já está inscrito
        if (eventInscriptionRepository.existsByUsuarioAndEvent(usuario, event)) {
            throw new RuntimeException("Usuário já está inscrito neste evento");
        }
        
        // Verificar capacidade máxima se houver
        if (event.getCapacidadeMaxima() != null) {
            long inscritos = eventInscriptionRepository.countByEvent(event);
            if (inscritos >= event.getCapacidadeMaxima()) {
                throw new RuntimeException("Evento atingiu a capacidade máxima");
            }
        }
        
        EventInscription inscription = EventInscription.builder()
                .usuario(usuario)
                .event(event)
                .build();
        
        eventInscriptionRepository.save(inscription);
        
        // Enviar email de confirmação de inscrição
        emailService.enviarEmailConfirmacaoInscricao(usuario, event);
        
        return eventService.toResponseDTO(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponseDTO> listarEventosInscritos() {
        Usuario usuario = sessionUtils.getUsuarioLogado();
        
        List<EventInscription> inscriptions = eventInscriptionRepository.findByUsuario(usuario);
        
        return inscriptions.stream()
                .map(EventInscription::getEvent)
                .filter(Event::getAtivo) // Apenas eventos ativos
                .map(eventService::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelarInscricao(UUID eventId) {
        Usuario usuario = sessionUtils.getUsuarioLogado();
        
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        
        EventInscription inscription = eventInscriptionRepository
                .findByUsuarioAndEvent(usuario, event)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));
        
        eventInscriptionRepository.delete(inscription);
        
        // Enviar email de cancelamento de inscrição
        emailService.enviarEmailCancelamentoInscricao(usuario, event);
    }

    @Transactional(readOnly = true)
    public List<EventResponseDTO> listarEventosComPresencaConfirmada() {
        Usuario usuario = sessionUtils.getUsuarioLogado();
        
        List<EventAttendance> attendances = eventAttendanceRepository.findByUsuarioAndPresente(usuario, true);
        
        return attendances.stream()
                .map(EventAttendance::getEvent)
                .filter(Event::getAtivo) // Apenas eventos ativos
                .map(eventService::toResponseDTO)
                .collect(Collectors.toList());
    }
}

