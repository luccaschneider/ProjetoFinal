package com.microsservicos.back.service;

import com.microsservicos.back.domain.Event;
import com.microsservicos.back.dto.EventResponseDTO;
import com.microsservicos.back.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public List<EventResponseDTO> listarTodos() {
        List<Event> eventos = eventRepository.findByAtivoTrue();
        return eventos.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<EventResponseDTO> listarProximos() {
        List<Event> eventos = eventRepository.findByAtivoTrueAndDataHoraInicioAfter(LocalDateTime.now());
        return eventos.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<EventResponseDTO> listarPorCategoria(String categoria) {
        List<Event> eventos = eventRepository.findByCategoriaAndAtivoTrue(categoria);
        return eventos.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public EventResponseDTO buscarPorId(UUID id) {
        Event evento = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        
        if (!evento.getAtivo()) {
            throw new RuntimeException("Evento não está ativo");
        }
        
        return toResponseDTO(evento);
    }

    public EventResponseDTO toResponseDTO(Event event) {
        return EventResponseDTO.builder()
                .id(event.getId())
                .nome(event.getNome())
                .detalhes(event.getDetalhes())
                .dataHoraInicio(event.getDataHoraInicio())
                .dataHoraFim(event.getDataHoraFim())
                .localEvento(event.getLocalEvento())
                .categoria(event.getCategoria())
                .capacidadeMaxima(event.getCapacidadeMaxima())
                .precoIngresso(event.getPrecoIngresso())
                .ativo(event.getAtivo())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}

