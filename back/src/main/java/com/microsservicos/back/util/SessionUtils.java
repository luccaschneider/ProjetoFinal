package com.microsservicos.back.util;

import com.microsservicos.back.domain.Usuario;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SessionUtils {

    /**
     * Obtém o usuário logado da sessão atual.
     * 
     * @return Usuario logado
     * @throws RuntimeException se não houver usuário autenticado
     */
    public Usuario getUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() 
            || !(authentication.getPrincipal() instanceof Usuario)) {
            throw new RuntimeException("Usuário não autenticado");
        }
        
        return (Usuario) authentication.getPrincipal();
    }

    /**
     * Verifica se há um usuário autenticado na sessão.
     * 
     * @return true se houver usuário autenticado, false caso contrário
     */
    public boolean isUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null 
            && authentication.isAuthenticated() 
            && authentication.getPrincipal() instanceof Usuario;
    }
}

