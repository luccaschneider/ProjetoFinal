package com.microsservicos.back.config;

import com.microsservicos.back.domain.Role;
import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(2) // Executa após o DatabaseInitializer (Order 1)
public class AdminUserInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@email.com";
        
        if (usuarioRepository.findByEmail(adminEmail).isEmpty()) {
            log.info("Criando usuário administrador padrão...");
            
            Usuario admin = Usuario.builder()
                    .name("Administrador")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("12345678"))
                    .role(Role.ADMIN)
                    .ativo(true)
                    .build();
            
            usuarioRepository.save(admin);
            log.info("Usuário administrador criado com sucesso! Email: {}, Senha: 12345678", adminEmail);
        } else {
            log.info("Usuário administrador já existe. Pulando criação.");
        }
    }
}

