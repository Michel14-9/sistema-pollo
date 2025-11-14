package com.sistemaapollo.sistema_apollo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http

                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        // PERMITIR endpoints POST de todos los módulos
                        .ignoringRequestMatchers(
                                "/api/auth/**",
                                "/api/direcciones/**",
                                "/cajero/marcar-pagado/**",
                                "/cajero/marcar-cancelado/**",
                                "/cocinero/iniciar-preparacion/**",
                                "/cocinero/marcar-listo/**",

                                "/delivery/iniciar-entrega/**",
                                "/delivery/marcar-entregado/**"
                        )
                )

                // CONFIGURACIÓN DE SESIÓN
                .sessionManagement(session -> session
                        .sessionFixation().migrateSession()
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false)
                        .expiredUrl("/login?expired=true")
                )

                // RUTAS Y PERMISOS
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas
                        .requestMatchers(
                                "/", "/index",
                                "/locales", "/nuestros-locales",
                                "/login", "/registrate", "/registro",
                                "/api/auth/**",
                                "/api/direcciones/**",
                                "/api/combos",
                                "/css/**", "/script/**", "/imagenes/**", "/archivos/**",
                                "/error", "/libro-reclamaciones", "/terminos",
                                "/politica-datos", "/politica-cookies",
                                "/menu", "/menu/**"
                        ).permitAll()

                        // Rutas admin
                        .requestMatchers("/admin-menu", "/admin/**").hasRole("ADMIN")

                        // Rutas cajero - QUITAR de permitAll() y dejar solo aquí
                        .requestMatchers("/cajero", "/cajero/**").hasRole("CAJERO")

                        // Rutas cocinero
                        .requestMatchers("/cocinero", "/cocinero/**").hasRole("COCINERO")

                        // Rutas delivery
                        .requestMatchers("/delivery", "/delivery/**").hasRole("DELIVERY")

                        // Rutas compartidas
                        .requestMatchers("/pedidos-comunes", "/api/pedidos-comunes/**")
                        .hasAnyRole("ADMIN", "CAJERO", "COCINERO", "DELIVERY")

                        // Rutas autenticadas
                        .requestMatchers(
                                "/carrito", "/carrito/**",
                                "/pago", "/pago/**",
                                "/pedido/**", "/pedidos/**",
                                "/api/pedidos/**", "/api/pedido/**",
                                "/crear-pedido", "/confirmar-pedido", "/confirmacion-pedido",
                                "/mis-cuentas", "/mis-datos", "/mis-direcciones",
                                "/mis-favoritos", "/mis-pedidos"
                        ).authenticated()

                        .anyRequest().authenticated()
                )

                // LOGIN FORM
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/postLogin") //  REDIRIGE AL CONTROLADOR
                        .failureUrl("/login?error=true")
                        .permitAll()
                )

                // LOGOUT
                .logout(logout -> logout
                        .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "GET"))
                        .logoutSuccessUrl("/login?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )

                // MANEJO DE EXCEPCIONES
                .exceptionHandling(exception -> exception
                        .accessDeniedPage("/login?accessDenied=true")
                );

        return http.build();
    }
}