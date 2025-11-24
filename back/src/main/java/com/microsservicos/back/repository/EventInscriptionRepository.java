package com.microsservicos.back.repository;

import com.microsservicos.back.domain.EventInscription;
import com.microsservicos.back.domain.Event;
import com.microsservicos.back.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventInscriptionRepository extends JpaRepository<EventInscription, UUID> {
    
    Optional<EventInscription> findByUsuarioAndEvent(Usuario usuario, Event event);
    
    List<EventInscription> findByUsuario(Usuario usuario);
    
    List<EventInscription> findByEvent(Event event);
    
    boolean existsByUsuarioAndEvent(Usuario usuario, Event event);
    
    long countByEvent(Event event);
}



