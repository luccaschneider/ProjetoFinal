package com.microsservicos.back.repository;

import com.microsservicos.back.domain.UserLog;
import com.microsservicos.back.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserLogRepository extends JpaRepository<UserLog, UUID> {
    
    Page<UserLog> findByUsuarioOrderByCreatedAtDesc(Usuario usuario, Pageable pageable);
    
    Page<UserLog> findByUsuarioAndActionOrderByCreatedAtDesc(Usuario usuario, String action, Pageable pageable);
}

