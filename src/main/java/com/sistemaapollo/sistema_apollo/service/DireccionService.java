package com.sistemaapollo.sistema_apollo.service;

import com.sistemaapollo.sistema_apollo.model.Direccion;
import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.repository.DireccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DireccionService {

    @Autowired
    private DireccionRepository direccionRepository;

    @Autowired
    private UsuarioService usuarioService;


    // OBTENER DIRECCIONES DEL USUARIO

    public List<Direccion> obtenerDireccionesUsuario(String username) {
        Usuario usuario = usuarioService.buscarPorCorreo(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return direccionRepository.findByUsuario(usuario);
    }


    // OBTENER DIRECCIÓN POR ID

    public Optional<Direccion> obtenerDireccionPorId(Long id) {
        return direccionRepository.findById(id);
    }


    // GUARDAR NUEVA DIRECCIÓN

    public Direccion guardarDireccion(Direccion direccion, String username) {
        Usuario usuario = usuarioService.buscarPorCorreo(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Si se marca como predeterminada, quitar predeterminada de otras direcciones
        if (direccion.isPredeterminada()) {
            quitarPredeterminadas(usuario);
        }

        direccion.setUsuario(usuario);
        return direccionRepository.save(direccion);
    }


    // ACTUALIZAR DIRECCIÓN

    public Direccion actualizarDireccion(Long id, Direccion direccionActualizada, String username) {
        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        // Verificar que la dirección pertenece al usuario
        if (!direccion.getUsuario().getUsername().equals(username)) {
            throw new RuntimeException("No tienes permisos para editar esta dirección");
        }

        // Si se marca como predeterminada, quitar predeterminada de otras direcciones
        if (direccionActualizada.isPredeterminada()) {
            quitarPredeterminadas(direccion.getUsuario());
        }

        // Actualizar campos
        direccion.setNombre(direccionActualizada.getNombre());
        direccion.setTipo(direccionActualizada.getTipo());
        direccion.setDireccion(direccionActualizada.getDireccion());
        direccion.setReferencia(direccionActualizada.getReferencia());
        direccion.setCiudad(direccionActualizada.getCiudad());
        direccion.setTelefono(direccionActualizada.getTelefono());
        direccion.setPredeterminada(direccionActualizada.isPredeterminada());
        direccion.setFacturacion(direccionActualizada.isFacturacion());

        return direccionRepository.save(direccion);
    }


    // ELIMINAR DIRECCIÓN

    public void eliminarDireccion(Long id, String username) {
        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        // Verificar que la dirección pertenece al usuario
        if (!direccion.getUsuario().getUsername().equals(username)) {
            throw new RuntimeException("No tienes permisos para eliminar esta dirección");
        }

        direccionRepository.delete(direccion);
    }


    // MARCAR DIRECCIÓN COMO PREDETERMINADA

    public void marcarPredeterminada(Long id, String username) {
        Usuario usuario = usuarioService.buscarPorCorreo(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        // Verificar que la dirección pertenece al usuario
        if (!direccion.getUsuario().getUsername().equals(username)) {
            throw new RuntimeException("No tienes permisos para modificar esta dirección");
        }

        // Quitar predeterminada de todas las direcciones del usuario
        quitarPredeterminadas(usuario);

        // Marcar la dirección seleccionada como predeterminada
        direccion.setPredeterminada(true);
        direccionRepository.save(direccion);
    }


    // OBTENER DIRECCIÓN PREDETERMINADA

    public Optional<Direccion> obtenerDireccionPredeterminada(String username) {
        Usuario usuario = usuarioService.buscarPorCorreo(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Direccion> direccionesPredeterminadas = direccionRepository.findByUsuarioAndPredeterminadaTrue(usuario);
        return direccionesPredeterminadas.stream().findFirst();
    }


    // OBTENER DIRECCIÓN DE FACTURACIÓN

    public Optional<Direccion> obtenerDireccionFacturacion(String username) {
        Usuario usuario = usuarioService.buscarPorCorreo(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Direccion> direccionesFacturacion = direccionRepository.findByUsuarioAndFacturacionTrue(usuario);
        return direccionesFacturacion.stream().findFirst();
    }


    // MÉTODO PRIVADO - QUITAR PREDETERMINADAS

    private void quitarPredeterminadas(Usuario usuario) {
        List<Direccion> direccionesPredeterminadas = direccionRepository.findByUsuarioAndPredeterminadaTrue(usuario);
        for (Direccion dir : direccionesPredeterminadas) {
            dir.setPredeterminada(false);
            direccionRepository.save(dir);
        }
    }


    // VERIFICAR PROPIEDAD DE DIRECCIÓN

    public boolean verificarPropiedadDireccion(Long direccionId, String username) {
        return direccionRepository.findById(direccionId)
                .map(direccion -> direccion.getUsuario().getUsername().equals(username))
                .orElse(false);
    }
}

