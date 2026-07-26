package com.distribuidora.system_oficina.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.distribuidora.system_oficina.security.JwtAuthenticationFilter;
import com.distribuidora.system_oficina.security.UserDetailsServiceImpl;
import com.distribuidora.system_oficina.role.RoleNameNormalizer;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ADMIN = RoleNameNormalizer.ADMIN;
    private static final String MANAGER = RoleNameNormalizer.MANAGER;
    private static final String SALESPERSON = RoleNameNormalizer.SALESPERSON;
    private static final String STOCK = RoleNameNormalizer.STOCK;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                writeErrorResponse(
                                        response,
                                        HttpServletResponse.SC_UNAUTHORIZED,
                                        "UNAUTHENTICATED",
                                        "Usuario nao autenticado ou token invalido."))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeErrorResponse(
                                        response,
                                        HttpServletResponse.SC_FORBIDDEN,
                                        "ACCESS_DENIED",
                                        "Voce nao possui permissao para executar esta acao.")))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/login", "/auth/login", "/error").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/employees", "/employees/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/clients", "/clients/**").hasAnyRole(ADMIN, MANAGER, SALESPERSON)
                        .requestMatchers("/clients", "/clients/**").hasAnyRole(ADMIN, MANAGER, SALESPERSON)
                        .requestMatchers(HttpMethod.GET, "/suppliers", "/suppliers/**").hasAnyRole(ADMIN, MANAGER, STOCK)
                        .requestMatchers("/suppliers", "/suppliers/**").hasAnyRole(ADMIN, MANAGER, STOCK)
                        .requestMatchers(HttpMethod.GET, "/categories", "/categories/**").hasAnyRole(ADMIN, MANAGER, STOCK)
                        .requestMatchers("/categories", "/categories/**").hasAnyRole(ADMIN, MANAGER)
                        .requestMatchers(HttpMethod.GET, "/products", "/products/**").hasAnyRole(ADMIN, MANAGER, SALESPERSON, STOCK)
                        .requestMatchers("/products", "/products/**").hasAnyRole(ADMIN, MANAGER, STOCK)
                        .requestMatchers("/stock", "/stock/**").hasAnyRole(ADMIN, MANAGER, STOCK)
                        .requestMatchers("/purchases", "/purchases/**").hasAnyRole(ADMIN, MANAGER, STOCK)
                        .requestMatchers("/sales", "/sales/**").hasAnyRole(ADMIN, MANAGER, SALESPERSON)
                        .requestMatchers(HttpMethod.GET, "/payment-methods", "/payment-methods/**").hasAnyRole(ADMIN, MANAGER, SALESPERSON)
                        .anyRequest().hasRole(ADMIN))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(authenticationProvider());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    private void writeErrorResponse(HttpServletResponse response, int status, String code, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"status":%d,"code":"%s","message":"%s"}
                """.formatted(status, code, message));
    }
}
