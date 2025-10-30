package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.ItemPedido;
import com.sistemaapollo.sistema_apollo.model.Pedido;
import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.repository.PedidoRepository;
import com.sistemaapollo.sistema_apollo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/cocinero")
public class CocineroController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Vista principal del cocinero
     */
    @GetMapping("")
    public String vistaCocinero(Authentication authentication, Model model) {
        try {
            // Obtener información del usuario cocinero
            String username = authentication.getName();
            Optional<Usuario> cocineroOpt = usuarioRepository.findByUsername(username);

            if (cocineroOpt.isPresent()) {
                Usuario cocinero = cocineroOpt.get();
                model.addAttribute("usuario", cocinero);
            }

            return "cocinero";

        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar la vista del cocinero: " + e.getMessage());
            return "cocinero";
        }
    }

    /**
     * Endpoint para cambiar estado a PREPARACION
     */
    @PostMapping("/iniciar-preparacion/{pedidoId}")
    @ResponseBody
    public ResponseEntity<?> iniciarPreparacion(@PathVariable String pedidoId,
                                                Authentication authentication) {
        try {
            System.out.println("=== INICIO iniciarPreparacion ===");
            System.out.println("🔐 Cocinero: " + (authentication != null ? authentication.getName() : "NULL"));
            System.out.println("📦 Pedido ID: " + pedidoId);

            // ✅ Verificar autenticación
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("ERROR: No autenticado");
            }

            // ✅ Verificar rol COCINERO
            boolean hasCocineroRole = authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority ->
                            grantedAuthority.getAuthority().equals("ROLE_COCINERO"));

            if (!hasCocineroRole) {
                return ResponseEntity.status(403).body("ERROR: No tiene permisos de cocinero");
            }

            // ✅ Convertir ID
            Long pedidoIdLong;
            try {
                pedidoIdLong = Long.parseLong(pedidoId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("ERROR: ID de pedido inválido");
            }

            // ✅ Buscar pedido
            Optional<Pedido> pedidoOpt = pedidoRepository.findById(pedidoIdLong);
            if (!pedidoOpt.isPresent()) {
                return ResponseEntity.badRequest().body("ERROR: Pedido no encontrado");
            }

            Pedido pedido = pedidoOpt.get();
            System.out.println("📋 Estado actual del pedido: " + pedido.getEstado());

            // ✅ Validar estado (debe estar PAGADO)
            if (!"PAGADO".equals(pedido.getEstado())) {
                return ResponseEntity.badRequest()
                        .body("ERROR: El pedido no está en estado PAGADO. Estado actual: " + pedido.getEstado());
            }

            // ✅ OBTENER INFORMACIÓN DEL COCINERO
            String nombreCocinero = obtenerNombreUsuario(authentication.getName());

            // ✅ Actualizar estado a PREPARACION
            pedido.setEstado("PREPARACION");
            Pedido pedidoActualizado = pedidoRepository.save(pedido);

            System.out.println("✅ ÉXITO: Pedido " + pedidoId + " en PREPARACIÓN por " + nombreCocinero);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Preparación iniciada correctamente");
            response.put("numeroPedido", pedidoActualizado.getNumeroPedido());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("💥 EXCEPCIÓN en iniciarPreparacion: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "ERROR");
            errorResponse.put("message", "Error: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Endpoint para cambiar estado a LISTO
     */
    @PostMapping("/marcar-listo/{pedidoId}")
    @ResponseBody
    public ResponseEntity<?> marcarComoListo(@PathVariable String pedidoId,
                                             Authentication authentication) {
        try {
            System.out.println("=== INICIO marcarComoListo ===");
            System.out.println("🔐 Cocinero: " + (authentication != null ? authentication.getName() : "NULL"));
            System.out.println("📦 Pedido ID: " + pedidoId);

            // ✅ Verificar autenticación
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("ERROR: No autenticado");
            }

            // ✅ Verificar rol COCINERO
            boolean hasCocineroRole = authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority ->
                            grantedAuthority.getAuthority().equals("ROLE_COCINERO"));

            if (!hasCocineroRole) {
                return ResponseEntity.status(403).body("ERROR: No tiene permisos de cocinero");
            }

            // ✅ Convertir ID
            Long pedidoIdLong;
            try {
                pedidoIdLong = Long.parseLong(pedidoId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("ERROR: ID de pedido inválido");
            }

            // ✅ Buscar pedido
            Optional<Pedido> pedidoOpt = pedidoRepository.findById(pedidoIdLong);
            if (!pedidoOpt.isPresent()) {
                return ResponseEntity.badRequest().body("ERROR: Pedido no encontrado");
            }

            Pedido pedido = pedidoOpt.get();
            System.out.println("📋 Estado actual del pedido: " + pedido.getEstado());

            // ✅ Validar estado (debe estar PREPARACION)
            if (!"PREPARACION".equals(pedido.getEstado())) {
                return ResponseEntity.badRequest()
                        .body("ERROR: El pedido no está en estado PREPARACION. Estado actual: " + pedido.getEstado());
            }

            // ✅ OBTENER INFORMACIÓN DEL COCINERO
            String nombreCocinero = obtenerNombreUsuario(authentication.getName());

            // ✅ Actualizar estado a LISTO
            pedido.setEstado("LISTO");
            Pedido pedidoActualizado = pedidoRepository.save(pedido);

            System.out.println("✅ ÉXITO: Pedido " + pedidoId + " marcado como LISTO por " + nombreCocinero);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Pedido marcado como LISTO correctamente");
            response.put("numeroPedido", pedidoActualizado.getNumeroPedido());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("💥 EXCEPCIÓN en marcarComoListo: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "ERROR");
            errorResponse.put("message", "Error: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Obtener pedidos PAGADOS (para preparar) - VERSIÓN CON DTO
     */
    @GetMapping("/pedidos-por-preparar")
    @ResponseBody
    public ResponseEntity<?> obtenerPedidosPorPreparar() {
        try {
            List<Pedido> pedidos = pedidoRepository.findByEstadoOrderByFechaAsc("PAGADO");

            // Crear DTOs para evitar problemas de serialización
            List<Map<String, Object>> pedidosDTO = crearPedidosDTO(pedidos);

            return ResponseEntity.ok(pedidosDTO);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Error al cargar pedidos por preparar: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtener pedidos en PREPARACION - VERSIÓN CON DTO
     */
    @GetMapping("/pedidos-en-preparacion")
    @ResponseBody
    public ResponseEntity<?> obtenerPedidosEnPreparacion() {
        try {
            List<Pedido> pedidos = pedidoRepository.findByEstadoOrderByFechaAsc("PREPARACION");

            // Crear DTOs para evitar problemas de serialización
            List<Map<String, Object>> pedidosDTO = crearPedidosDTO(pedidos);

            return ResponseEntity.ok(pedidosDTO);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Error al cargar pedidos en preparación: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtener pedidos LISTOS de hoy - VERSIÓN CON DTO
     */
    @GetMapping("/pedidos-listos-hoy")
    @ResponseBody
    public ResponseEntity<?> obtenerPedidosListosHoy() {
        try {
            LocalDate hoy = LocalDate.now();
            List<Pedido> pedidos = pedidoRepository.findAll().stream()
                    .filter(p -> "LISTO".equals(p.getEstado()) &&
                            p.getFecha() != null &&
                            p.getFecha().toLocalDate().equals(hoy))
                    .collect(Collectors.toList());

            // Crear DTOs para evitar problemas de serialización
            List<Map<String, Object>> pedidosDTO = crearPedidosDTO(pedidos);

            return ResponseEntity.ok(pedidosDTO);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Error al cargar pedidos listos: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtener métricas del cocinero (para AJAX)
     */
    @GetMapping("/metricas-cocina")
    @ResponseBody
    public Map<String, Object> obtenerMetricasCocina() {
        Map<String, Object> metricas = new HashMap<>();

        try {
            List<Pedido> pedidosPorPreparar = pedidoRepository.findByEstadoOrderByFechaAsc("PAGADO");
            List<Pedido> pedidosEnPreparacion = pedidoRepository.findByEstadoOrderByFechaAsc("PREPARACION");

            // Pedidos LISTOS de hoy
            LocalDate hoy = LocalDate.now();
            List<Pedido> pedidosListosHoy = pedidoRepository.findAll().stream()
                    .filter(p -> "LISTO".equals(p.getEstado()) &&
                            p.getFecha() != null &&
                            p.getFecha().toLocalDate().equals(hoy))
                    .collect(Collectors.toList());

            // Calcular tiempo promedio
            double tiempoPromedio = calcularTiempoPromedioPreparacion(pedidosListosHoy);

            metricas.put("totalPorPreparar", pedidosPorPreparar.size());
            metricas.put("totalEnPreparacion", pedidosEnPreparacion.size());
            metricas.put("totalListosHoy", pedidosListosHoy.size());
            metricas.put("tiempoPromedio", Math.round(tiempoPromedio));
            metricas.put("success", true);

        } catch (Exception e) {
            metricas.put("success", false);
            metricas.put("error", e.getMessage());
        }

        return metricas;
    }

    /**
     * Obtener detalles de un pedido específico
     */
    @GetMapping("/pedido/{pedidoId}")
    @ResponseBody
    public ResponseEntity<?> obtenerDetallePedido(@PathVariable Long pedidoId) {
        try {
            Optional<Pedido> pedidoOpt = pedidoRepository.findByIdWithItems(pedidoId);

            if (pedidoOpt.isPresent()) {
                Pedido pedido = pedidoOpt.get();
                Map<String, Object> pedidoDTO = crearPedidoDetalleDTO(pedido);
                return ResponseEntity.ok(pedidoDTO);
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Pedido no encontrado"));
            }

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * ================== MÉTODOS PRIVADOS AUXILIARES ==================
     */

    /**
     * Crear DTO para lista de pedidos
     */
    private List<Map<String, Object>> crearPedidosDTO(List<Pedido> pedidos) {
        List<Map<String, Object>> pedidosDTO = new ArrayList<>();

        for (Pedido pedido : pedidos) {
            Map<String, Object> pedidoDTO = new HashMap<>();
            pedidoDTO.put("id", pedido.getId());
            pedidoDTO.put("numeroPedido", pedido.getNumeroPedido());
            pedidoDTO.put("total", pedido.getTotal());
            pedidoDTO.put("fecha", pedido.getFecha());
            pedidoDTO.put("estado", pedido.getEstado());
            pedidoDTO.put("metodoPago", pedido.getMetodoPago());
            pedidoDTO.put("tipoEntrega", pedido.getTipoEntrega());
            pedidoDTO.put("observaciones", pedido.getObservaciones());

            // Información del cliente
            if (pedido.getUsuario() != null) {
                Map<String, String> usuarioDTO = new HashMap<>();
                usuarioDTO.put("nombres", pedido.getUsuario().getNombres());
                usuarioDTO.put("apellidos", pedido.getUsuario().getApellidos());
                usuarioDTO.put("telefono", pedido.getUsuario().getTelefono());
                pedidoDTO.put("cliente", usuarioDTO);
            } else {
                pedidoDTO.put("cliente", null);
            }

            // Información de items del pedido
            List<Map<String, Object>> itemsDTO = new ArrayList<>();
            if (pedido.getItems() != null) {
                for (ItemPedido item : pedido.getItems()) {
                    Map<String, Object> itemDTO = new HashMap<>();
                    itemDTO.put("nombreProducto", item.getNombreProducto());
                    itemDTO.put("cantidad", item.getCantidad());
                    itemDTO.put("precio", item.getPrecio());
                    itemDTO.put("subtotal", item.getSubtotal());
                    itemsDTO.add(itemDTO);
                }
            }
            pedidoDTO.put("items", itemsDTO);

            pedidosDTO.add(pedidoDTO);
        }

        return pedidosDTO;
    }

    /**
     * Crear DTO para detalle de pedido
     */
    private Map<String, Object> crearPedidoDetalleDTO(Pedido pedido) {
        Map<String, Object> pedidoDTO = new HashMap<>();
        pedidoDTO.put("id", pedido.getId());
        pedidoDTO.put("numeroPedido", pedido.getNumeroPedido());
        pedidoDTO.put("total", pedido.getTotal());
        pedidoDTO.put("fecha", pedido.getFecha());
        pedidoDTO.put("estado", pedido.getEstado());
        pedidoDTO.put("metodoPago", pedido.getMetodoPago());
        pedidoDTO.put("tipoEntrega", pedido.getTipoEntrega());
        pedidoDTO.put("direccionEntrega", pedido.getDireccionEntrega());
        pedidoDTO.put("observaciones", pedido.getObservaciones());
        pedidoDTO.put("instrucciones", pedido.getInstrucciones());

        // Información del cliente
        if (pedido.getUsuario() != null) {
            Map<String, String> usuarioDTO = new HashMap<>();
            usuarioDTO.put("nombres", pedido.getUsuario().getNombres());
            usuarioDTO.put("apellidos", pedido.getUsuario().getApellidos());
            usuarioDTO.put("telefono", pedido.getUsuario().getTelefono());
            pedidoDTO.put("cliente", usuarioDTO);
        }

        // Información de items del pedido
        List<Map<String, Object>> itemsDTO = new ArrayList<>();
        if (pedido.getItems() != null) {
            for (ItemPedido item : pedido.getItems()) {
                Map<String, Object> itemDTO = new HashMap<>();
                itemDTO.put("nombreProducto", item.getNombreProducto());
                itemDTO.put("cantidad", item.getCantidad());
                itemDTO.put("precio", item.getPrecio());
                itemDTO.put("subtotal", item.getSubtotal());
                itemsDTO.add(itemDTO);
            }
        }
        pedidoDTO.put("items", itemsDTO);

        return pedidoDTO;
    }

    /**
     * Obtener nombre del usuario
     */
    private String obtenerNombreUsuario(String username) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (usuario.getNombres() != null && usuario.getApellidos() != null) {
                return usuario.getNombres() + " " + usuario.getApellidos();
            } else if (usuario.getNombres() != null) {
                return usuario.getNombres();
            }
        }
        return username;
    }

    /**
     * Calcular tiempo promedio de preparación en minutos
     */
    private double calcularTiempoPromedioPreparacion(List<Pedido> pedidosListos) {
        if (pedidosListos.isEmpty()) return 0.0;

        double totalMinutos = 0;
        int contador = 0;

        for (Pedido pedido : pedidosListos) {
            if (pedido.getFecha() != null) {
                LocalDateTime fechaPedido = pedido.getFecha();
                LocalDateTime ahora = LocalDateTime.now();

                long minutos = java.time.Duration.between(fechaPedido, ahora).toMinutes();
                if (minutos > 0) {
                    totalMinutos += minutos;
                    contador++;
                }
            }
        }

        return contador > 0 ? totalMinutos / contador : 0.0;
    }
}