package com.microsservicos.back.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${swagger.server.url:}")
    private String swaggerServerUrl;

    @Value("${swagger.server.host:}")
    private String swaggerServerHost;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        // Determinar a URL do servidor para o Swagger
        String serverUrl = determineServerUrl();
        
        List<Server> servers = new ArrayList<>();
        servers.add(new Server()
            .url(serverUrl)
            .description("Servidor principal (Java + Node.js via proxy)"));
        
        // Adicionar localhost como alternativa se não for localhost
        if (!serverUrl.contains("localhost") && !serverUrl.contains("127.0.0.1")) {
            servers.add(new Server()
                .url("http://localhost:" + serverPort)
                .description("Servidor local (desenvolvimento)"));
        }
        
        return new OpenAPI()
            .info(new Info()
                .title("API Microsserviços - Sistema Completo")
                .version("1.0.0")
                .description("API REST completa para sistema de autenticação, gerenciamento de usuários, eventos e certificados. " +
                           "Todos os endpoints estão disponíveis nesta documentação.")
                .contact(new Contact()
                    .name("Equipe de Desenvolvimento")
                    .email("dev@example.com"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
            .servers(servers)
            .addSecurityItem(new SecurityRequirement()
                .addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName,
                    new SecurityScheme()
                        .name(securitySchemeName)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Autenticação via sessão HTTP")));
    }

    private String determineServerUrl() {
        // 1. Prioridade: swagger.server.url (URL completa)
        if (swaggerServerUrl != null && !swaggerServerUrl.trim().isEmpty()) {
            return swaggerServerUrl.trim();
        }
        
        // 2. Prioridade: swagger.server.host (apenas host, usa a porta do servidor)
        if (swaggerServerHost != null && !swaggerServerHost.trim().isEmpty()) {
            String host = swaggerServerHost.trim();
            // Garantir que tenha protocolo
            if (!host.startsWith("http://") && !host.startsWith("https://")) {
                host = "http://" + host;
            }
            // Adicionar porta se não tiver
            if (!host.contains(":")) {
                host = host + ":" + serverPort;
            }
            return host;
        }
        
        // 3. Fallback: localhost (desenvolvimento)
        return "http://localhost:" + serverPort;
    }
}

