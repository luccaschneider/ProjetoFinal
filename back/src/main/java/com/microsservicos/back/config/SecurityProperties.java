package com.microsservicos.back.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

    /**
     * Lista de rotas públicas que não requerem autenticação.
     * Configurável via application.properties usando índices:
     * security.public-routes[0]=/api/auth/cadastro
     * security.public-routes[1]=/api/auth/login
     * 
     * Ou usando vírgula em uma única linha:
     * security.public-routes=/api/auth/cadastro,/api/auth/login
     */
    private List<String> publicRoutes = new ArrayList<>();

    /**
     * Setter customizado para aceitar string separada por vírgula
     * além da sintaxe com índices do Spring Boot
     */
    public void setPublicRoutes(String routes) {
        if (routes != null && !routes.trim().isEmpty()) {
            this.publicRoutes = Arrays.stream(routes.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }
}

