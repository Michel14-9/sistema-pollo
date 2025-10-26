package com.sistemaapollo.sistema_apollo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
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
                        .ignoringRequestMatchers("/logout")
                )

                
                .sessionManagement(session -> session
                        .sessionFixation().migrateSession()
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false)
                        .expiredUrl("/login?expired=true")
                )

                //  RUTAS Y PERMISOS
                .authorizeHttpRequests(auth -> auth
                        // Rutas públicas
                        .requestMatchers(
                                "/", "/index",
                                "/locales", "/nuestros-locales",
                                "/login", "/registrate", "/registro",
                                "/api/auth/**",
                                "/css/**", "/static/css/script/**", "/imagenes/**", "/archivos/**",
                                "/error", "/libro-reclamaciones", "/terminos",
                                "/politica-datos", "/politica-cookies",
                                "/menu", "/menu/**"
                        ).permitAll()

                        //  Rutas admin
                        .requestMatchers("/admin-menu", "/admin/**").hasRole("ADMIN")

                        //  Rutas autenticadas
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

                //  LOGIN
                .formLogin(form -> form
                        .loginPage("/login")
                        .successHandler(customAuthenticationSuccessHandler())
                        .failureUrl("/login?error=true")
                        .permitAll()
                )

                //  LOGOUT - PERMITIENDO GET EXPLÍCITAMENTE
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

    //  BEAN PARA EL MANEJADOR DE REDIRECCIÓN PERSONALIZADO
    @Bean
    public AuthenticationSuccessHandler customAuthenticationSuccessHandler() {
        return new AuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest request,
                                                HttpServletResponse response,
                                                Authentication authentication) throws IOException, ServletException {

                // Verificar si el usuario tiene rol ADMIN
                boolean isAdmin = authentication.getAuthorities().stream()
                        .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

                if (isAdmin) {
                    // Redirigir admin a su panel
                    response.sendRedirect("/admin-menu");
                } else {
                    // Redirigir usuarios normales a la página principal
                    response.sendRedirect("/");
                }
            }
        };
    }
}
