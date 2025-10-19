package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.dto.DireccionDTO;
import com.sistemaapollo.sistema_apollo.dto.DireccionRequestDTO;
import com.sistemaapollo.sistema_apollo.model.Direccion;
import com.sistemaapollo.sistema_apollo.service.DireccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/direcciones")
public class DireccionController {

    @Autowired
    private DireccionService direccionService;


    // OBTENER DIRECCIONES DEL USUARIO (CON DTOs)

    @GetMapping
    public ResponseEntity<?> obtenerDireccionesUsuario(Authentication authentication) {
        try {
            System.out.println("📥 === OBTENIENDO DIRECCIONES DEL USUARIO ===");
            String username = authentication.getName();
            System.out.println("🔍 Usuario: " + username);

            List<Direccion> direcciones = direccionService.obtenerDireccionesUsuario(username);
            List<DireccionDTO> direccionesDTO = direcciones.stream()
                    .map(DireccionDTO::new)
                    .collect(Collectors.toList());

            System.out.println(" Direcciones encontradas: " + direccionesDTO.size());
            return ResponseEntity.ok(direccionesDTO);

        } catch (Exception e) {
            System.out.println(" Error obteniendo direcciones: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error al obtener las direcciones: " + e.getMessage());
        }
    }


// GUARDAR NUEVA DIRECCIÓN (CON DTOs) -

    @PostMapping
    public ResponseEntity<?> guardarDireccion(@RequestBody DireccionRequestDTO direccionRequest,
                                              Authentication authentication) {
        try {
            System.out.println(" === INICIANDO GUARDADO DE DIRECCIÓN ===");
            System.out.println(" Usuario autenticado: " + authentication.getName());
            System.out.println(" Datos recibidos del frontend:");
            System.out.println("   - Nombre: " + direccionRequest.getNombre());
            System.out.println("   - Tipo: " + direccionRequest.getTipo());
            System.out.println("   - Dirección: " + direccionRequest.getDireccion());
            System.out.println("   - Referencia: " + direccionRequest.getReferencia());
            System.out.println("   - Ciudad: " + direccionRequest.getCiudad());
            System.out.println("   - Teléfono: " + direccionRequest.getTelefono());
            System.out.println("   - Predeterminada: " + direccionRequest.isPredeterminada());
            System.out.println("   - Facturación: " + direccionRequest.isFacturacion());

            String username = authentication.getName();

            // Validaciones básicas
            if (direccionRequest.getNombre() == null || direccionRequest.getNombre().trim().isEmpty()) {
                System.out.println(" ERROR: Nombre de dirección vacío");
                return ResponseEntity.badRequest().body("El nombre de la dirección es obligatorio");
            }

            if (direccionRequest.getDireccion() == null || direccionRequest.getDireccion().trim().isEmpty()) {
                System.out.println(" ERROR: Dirección vacía");
                return ResponseEntity.badRequest().body("La dirección es obligatoria");
            }

            System.out.println(" Convirtiendo DTO a entidad...");
            Direccion direccion = direccionRequest.toEntity();

            System.out.println(" Llamando al servicio para guardar...");
            Direccion direccionGuardada = direccionService.guardarDireccion(direccion, username);

            System.out.println(" Dirección guardada en BD con ID: " + direccionGuardada.getId());

            DireccionDTO direccionDTO = new DireccionDTO(direccionGuardada);
            System.out.println(" Enviando respuesta con DTO ID: " + direccionDTO.getId());

            return ResponseEntity.ok(direccionDTO);

        } catch (Exception e) {
            System.out.println(" ERROR guardando dirección: " + e.getMessage());
            e.printStackTrace(); // Esto te dará más detalles del error
            return ResponseEntity.badRequest().body("Error al guardar la dirección: " + e.getMessage());
        }
    }


    // ACTUALIZAR DIRECCIÓN (CON DTOs)

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarDireccion(@PathVariable Long id,
                                                 @RequestBody DireccionRequestDTO direccionRequest,
                                                 Authentication authentication) {
        try {
            System.out.println("✏ === ACTUALIZANDO DIRECCIÓN ===");
            String username = authentication.getName();
            System.out.println(" Usuario: " + username);
            System.out.println(" ID dirección: " + id);
            System.out.println(" Datos actualizados: " + direccionRequest);

            Direccion direccionActualizada = direccionRequest.toEntity();
            Direccion direccionActualizadaBD = direccionService.actualizarDireccion(id, direccionActualizada, username);
            DireccionDTO direccionDTO = new DireccionDTO(direccionActualizadaBD);

            System.out.println("Dirección actualizada: " + direccionDTO.getId());
            return ResponseEntity.ok(direccionDTO);

        } catch (Exception e) {
            System.out.println(" Error actualizando dirección: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error al actualizar la dirección: " + e.getMessage());
        }
    }

    // ==========================
    // ELIMINAR DIRECCIÓN (SIN CAMBIOS)
    // ==========================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarDireccion(@PathVariable Long id, Authentication authentication) {
        try {
            System.out.println("🗑 === ELIMINANDO DIRECCIÓN ===");
            String username = authentication.getName();
            System.out.println(" Usuario: " + username);
            System.out.println(" ID dirección a eliminar: " + id);

            direccionService.eliminarDireccion(id, username);
            System.out.println(" Dirección eliminada: " + id);

            return ResponseEntity.ok("Dirección eliminada correctamente");

        } catch (Exception e) {
            System.out.println(" Error eliminando dirección: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error al eliminar la dirección: " + e.getMessage());
        }
    }


    // MARCAR DIRECCIÓN COMO PREDETERMINADA (SIN CAMBIOS)

    @PutMapping("/{id}/predeterminada")
    public ResponseEntity<?> marcarPredeterminada(@PathVariable Long id, Authentication authentication) {
        try {
            System.out.println(" === MARCANDO DIRECCIÓN COMO PREDETERMINADA ===");
            String username = authentication.getName();
            System.out.println(" Usuario: " + username);
            System.out.println(" ID dirección: " + id);

            direccionService.marcarPredeterminada(id, username);
            System.out.println(" Dirección marcada como predeterminada: " + id);

            return ResponseEntity.ok("Dirección establecida como predeterminada");

        } catch (Exception e) {
            System.out.println(" Error marcando dirección como predeterminada: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error al establecer la dirección como predeterminada: " + e.getMessage());
        }
    }

    // ==========================
    // OBTENER DIRECCIÓN PREDETERMINADA (CON DTO)
    // ==========================
    @GetMapping("/predeterminada")
    public ResponseEntity<?> obtenerDireccionPredeterminada(Authentication authentication) {
        try {
            System.out.println(" === OBTENIENDO DIRECCIÓN PREDETERMINADA ===");
            String username = authentication.getName();
            System.out.println(" Usuario: " + username);

            return direccionService.obtenerDireccionPredeterminada(username)
                    .map(direccion -> ResponseEntity.ok(new DireccionDTO(direccion)))
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            System.out.println(" Error obteniendo dirección predeterminada: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error al obtener la dirección predeterminada: " + e.getMessage());
        }
    }
}
