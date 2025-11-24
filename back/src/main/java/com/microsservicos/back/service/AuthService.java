package com.microsservicos.back.service;

import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.LoginDTO;
import com.microsservicos.back.dto.LoginResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponseDTO login(LoginDTO dto) {
        Usuario usuario = usuarioService.buscarPorEmail(dto.getEmail());

        if (!usuario.getAtivo()) {
            throw new RuntimeException("Usuário inativo");
        }

        if (!passwordEncoder.matches(dto.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Email ou senha inválidos");
        }

        String token = jwtService.generateToken(usuario.getEmail());

        return LoginResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .id(usuario.getId())
                .name(usuario.getName())
                .email(usuario.getEmail())
                .telefone(usuario.getTelefone())
                .documento(usuario.getDocumento())
                .ativo(usuario.getAtivo())
                .role(usuario.getRole())
                .createdAt(usuario.getCreatedAt())
                .updatedAt(usuario.getUpdatedAt())
                .build();
    }
}

