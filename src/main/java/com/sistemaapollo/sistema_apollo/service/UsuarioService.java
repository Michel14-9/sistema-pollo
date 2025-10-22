package com.sistemaapollo.sistema_apollo.service;

import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository userRepository;

    // 🔹 Instancia de BCryptPasswordEncoder
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 🔹 Autenticar usuario
    public Optional<Usuario> autenticar(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()));
    }

    // 🔹 Guardar usuario (registro) con encriptación de contraseña
    public Usuario guardarUsuario(Usuario user) {
        // Encriptamos la contraseña antes de guardar
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // 🔹 Buscar usuario por correo/username
    public Optional<Usuario> buscarPorUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // 🔹 Buscar usuario por ID
    public Optional<Usuario> obtenerPorId(Long id) {
        return userRepository.findById(id);
    }

    // 🔹 Obtener la vista según rol del usuario
    public String obtenerVistaPorRol(Usuario user) {
        if(user.getRol() == null) return "/"; // fallback
        switch (user.getRol().toUpperCase()) {
            case "ADMIN":
                return "/admin/menu";  // ruta de administrador
            case "CLIENTE":
                return "/menu";             // ruta de cliente
            default:
                return "/";                 // fallback
        }
    }
    public Optional<Usuario> buscarPorCorreo(String correo) {
        return userRepository.findByUsername(correo); // username = correo
    }


}
