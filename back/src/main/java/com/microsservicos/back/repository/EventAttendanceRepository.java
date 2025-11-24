package com.microsservicos.back.repository;

import com.microsservicos.back.domain.EventAttendance;
import com.microsservicos.back.domain.Event;
import com.microsservicos.back.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventAttendanceRepository extends JpaRepository<EventAttendance, UUID> {
    
    Optional<EventAttendance> findByUsuarioAndEvent(Usuario usuario, Event event);
    
    List<EventAttendance> findByUsuario(Usuario usuario);
    
    List<EventAttendance> findByEvent(Event event);
    
    List<EventAttendance> findByUsuarioAndPresente(Usuario usuario, Boolean presente);
    
    boolean existsByUsuarioAndEvent(Usuario usuario, Event event);
}



