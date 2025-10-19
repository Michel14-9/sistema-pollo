package com.sistemaapollo.sistema_apollo.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PostLoginController {

    /**
     * Redirige al usuario según su rol después de iniciar sesión
     */
    @GetMapping("/postLogin")
    public String postLogin(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/login"; // fallback por seguridad
        }

        // Obtiene el rol del usuario
        String rol = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");

        switch (rol) {
            case "ROLE_ADMIN":
                return "redirect:/admin-menu"; // tu menú admin
            case "ROLE_CLIENTE":
                return "redirect:/menu";       // menú para clientes
            default:
                return "redirect:/";           // fallback
        }
    }
}
