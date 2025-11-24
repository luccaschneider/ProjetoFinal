package com.microsservicos.back.config;

import com.microsservicos.back.domain.Usuario;
import com.microsservicos.back.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SecurityProperties securityProperties;
    private final UsuarioRepository usuarioRepository;
    private final ApplicationContext applicationContext;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Obtém o filtro do contexto de forma lazy para evitar dependência circular
        JwtAuthenticationFilter jwtAuthenticationFilter = applicationContext.getBean(JwtAuthenticationFilter.class);
        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> {
                // Endpoint interno de email (usado pelo Node.js)
                auth.requestMatchers(HttpMethod.POST, "/api/emails/**").permitAll();
                
                // Endpoint público de validação de certificados
                auth.requestMatchers(HttpMethod.GET, "/api/certificates/validate/**").permitAll();
                
                // Permitir apenas GETs nas rotas de eventos (consultas públicas)
                auth.requestMatchers(HttpMethod.GET, "/api/events/**").permitAll();
                
                // Endpoints de inscrição em eventos requerem autenticação (devem vir depois dos GETs públicos)
                // Padrão: /api/events/{uuid}/inscricao - usar * para capturar um segmento (UUID)
                auth.requestMatchers(HttpMethod.POST, "/api/events/*/inscricao").authenticated();
                auth.requestMatchers(HttpMethod.DELETE, "/api/events/*/inscricao").authenticated();
                auth.requestMatchers(HttpMethod.GET, "/api/events/inscricoes").authenticated();
                auth.requestMatchers(HttpMethod.GET, "/api/events/presencas").authenticated();
                
                // Permitir rotas públicas configuráveis
                List<String> publicRoutes = securityProperties.getPublicRoutes();
                if (publicRoutes != null && !publicRoutes.isEmpty()) {
                    for (String route : publicRoutes) {
                        // Pular rotas de eventos já configuradas acima
                        if (!route.contains("/api/events")) {
                            auth.requestMatchers(route).permitAll();
                        }
                    }
                }
                // Todas as outras rotas requerem autenticação
                auth.anyRequest().authenticated();
            })
            .userDetailsService(userDetailsService())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> {
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
            
            if (!usuario.getAtivo()) {
                throw new UsernameNotFoundException("Usuário inativo: " + email);
            }
            
            return usuario; // Usuario já implementa UserDetails
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

