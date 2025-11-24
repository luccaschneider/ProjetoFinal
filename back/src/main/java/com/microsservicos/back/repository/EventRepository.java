package com.microsservicos.back.repository;

import com.microsservicos.back.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    
    List<Event> findByAtivoTrue();
    
    List<Event> findByAtivoTrueAndDataHoraInicioAfter(LocalDateTime dataHora);
    
    List<Event> findByCategoriaAndAtivoTrue(String categoria);
}

