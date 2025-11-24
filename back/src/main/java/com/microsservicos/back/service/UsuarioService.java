package com.microsservicos.back.service;

import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.dto.CadastroUsuarioDTO;
import com.microsservicos.back.dto.UpdateProfileDTO;
import com.microsservicos.back.dto.UsuarioResponseDTO;
import com.microsservicos.back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public UsuarioResponseDTO cadastrar(CadastroUsuarioDTO dto) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }

        Usuario usuario = Usuario.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .telefone(removerFormatacaoTelefone(dto.getTelefone()))
                .documento(removerFormatacaoDocumento(dto.getDocumento()))
                .password(passwordEncoder.encode(dto.getPassword()))
                .ativo(true)
                .build();

        usuario = usuarioRepository.save(usuario);
        
        // Enviar email de confirmação de cadastro
        emailService.enviarEmailConfirmacaoCadastro(usuario);
        
        return toResponseDTO(usuario);
    }

    /**
     * Remove formatação do telefone, mantendo apenas números
     * Exemplo: "(11) 99999-9999" -> "11999999999"
     */
    private String removerFormatacaoTelefone(String telefone) {
        if (telefone == null || telefone.trim().isEmpty()) {
            return null;
        }
        // Remove todos os caracteres não numéricos
        return telefone.replaceAll("[^0-9]", "");
    }

    /**
     * Remove formatação do documento (CPF/CNPJ), mantendo apenas números
     * Exemplo: "123.456.789-00" -> "12345678900"
     * Exemplo: "12.345.678/0001-90" -> "12345678000190"
     */
    private String removerFormatacaoDocumento(String documento) {
        if (documento == null || documento.trim().isEmpty()) {
            return null;
        }
        // Remove todos os caracteres não numéricos
        return documento.replaceAll("[^0-9]", "");
    }

    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    @Transactional
    public UsuarioResponseDTO atualizarPerfil(Usuario usuario, UpdateProfileDTO dto) {
        // Atualizar apenas os campos fornecidos
        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            usuario.setName(dto.getName());
        }
        
        if (dto.getTelefone() != null) {
            if (dto.getTelefone().trim().isEmpty()) {
                // Permite limpar o telefone enviando string vazia
                usuario.setTelefone(null);
            } else {
                usuario.setTelefone(removerFormatacaoTelefone(dto.getTelefone()));
            }
        }
        
        if (dto.getDocumento() != null) {
            if (dto.getDocumento().trim().isEmpty()) {
                // Permite limpar o documento enviando string vazia
                usuario.setDocumento(null);
            } else {
                usuario.setDocumento(removerFormatacaoDocumento(dto.getDocumento()));
            }
        }
        
        usuario = usuarioRepository.save(usuario);
        return toResponseDTO(usuario);
    }

    public UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        return UsuarioResponseDTO.builder()
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

