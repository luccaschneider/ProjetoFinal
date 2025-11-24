package com.microsservicos.back.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    private static final String ALLOWED_IP = "177.44.248.82";

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Permitir origens específicas incluindo o IP permitido
        // IMPORTANTE: Frontend pode fazer requisições do IP de produção
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",  // Frontend (desenvolvimento)
            "http://localhost:3001",  // Certificate Service (desenvolvimento)
            "http://localhost:8080",   // Backend Java (desenvolvimento)
            "http://127.0.0.1:3000",  // Frontend (alternativa localhost)
            "http://127.0.0.1:3001",  // Certificate Service (alternativa localhost)
            "http://127.0.0.1:8080",  // Backend Java (alternativa localhost)
            "http://" + ALLOWED_IP,           // IP permitido sem porta
            "http://" + ALLOWED_IP + ":3000", // Frontend no IP de produção (LIBERADO)
            "http://" + ALLOWED_IP + ":3001", // Certificate Service no IP de produção
            "http://" + ALLOWED_IP + ":8080"  // Backend Java no IP de produção
        ));
        
        // Permitir métodos HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Permitir headers
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Permitir credenciais
        configuration.setAllowCredentials(true);
        
        // Headers expostos
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        
        // Cache de preflight
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}

