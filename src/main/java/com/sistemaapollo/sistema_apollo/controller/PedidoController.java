package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.Pedido;
import com.sistemaapollo.sistema_apollo.model.CarritoItem;
import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.service.PedidoService;
import com.sistemaapollo.sistema_apollo.service.CarritoService;
import com.sistemaapollo.sistema_apollo.service.UsuarioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/pedido")
public class PedidoController {

    private final PedidoService pedidoService;
    private final CarritoService carritoService;
    private final UsuarioService usuarioService;
    private final ObjectMapper objectMapper;

    public PedidoController(PedidoService pedidoService,
                            CarritoService carritoService,
                            UsuarioService usuarioService) {
        this.pedidoService = pedidoService;
        this.carritoService = carritoService;
        this.usuarioService = usuarioService;
        this.objectMapper = new ObjectMapper();
    }

    //  CREAR PEDIDO
    @PostMapping("/crear")
    public String crearPedido(@RequestParam String datosPedido,
                              HttpServletRequest request,
                              Authentication authentication) {
        try {
            System.out.println("===  CREAR PEDIDO CON FORMULARIO ===");

            // Verificar autenticación
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println(" Usuario no autenticado - Redirigiendo a login");
                return "redirect:/login?redirect=/pago";
            }

            String correo = authentication.getName();
            System.out.println(" Usuario autenticado: " + correo);

            // Convertir JSON string a Map
            Map<String, Object> datos = objectMapper.readValue(datosPedido, Map.class);
            System.out.println(" Datos del pedido recibidos: " + datos);

            Usuario usuario = usuarioService.buscarPorCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Obtener carrito del usuario
            List<CarritoItem> carrito = carritoService.obtenerCarrito(usuario.getId());
            System.out.println("🛒 Items en carrito: " + carrito.size());

            if (carrito.isEmpty()) {
                System.out.println(" Carrito vacío");
                return "redirect:/carrito?error=carrito_vacio";
            }

            // Crear el pedido
            Pedido pedido = pedidoService.crearPedido(usuario, carrito, datos);
            System.out.println(" Pedido creado - ID: " + pedido.getId());

            // Limpiar carrito después del pedido exitoso
            carritoService.limpiarCarrito(usuario.getId());
            System.out.println(" Carrito limpiado");

            //  REDIRIGIR A LA PÁGINA DE CONFIRMACIÓN
            return "redirect:/pedido/confirmacion-pedido?id=" + pedido.getId();

        } catch (Exception e) {
            System.err.println(" Error al crear pedido: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/pago?error=pedido_error";
        }
    }

    //  PÁGINA DE CONFIRMACIÓN DE PEDIDO
    @GetMapping("/confirmacion-pedido")
    public String mostrarConfirmacion(@RequestParam(required = false) Long id,
                                      Authentication authentication,
                                      Model model) {
        try {
            System.out.println("===  CARGANDO PÁGINA DE CONFIRMACIÓN ===");

            if (authentication == null || !authentication.isAuthenticated()) {
                return "redirect:/login?redirect=/confirmacion-pedido";
            }

            String correo = authentication.getName();
            Usuario usuario = usuarioService.buscarPorCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (id != null) {
                Optional<Pedido> pedidoOpt = pedidoService.obtenerPedidoPorId(id);

                if (pedidoOpt.isPresent() && pedidoOpt.get().getUsuario().getId().equals(usuario.getId())) {
                    Pedido pedido = pedidoOpt.get();

                    //  AGREGAR DATOS DEL PEDIDO AL MODELO
                    model.addAttribute("pedido", pedido);
                    model.addAttribute("usuario", usuario);

                    //  AGREGAR DATOS ESPECÍFICOS PARA FÁCIL ACCESO
                    model.addAttribute("numeroPedido", pedido.getNumeroPedido());
                    model.addAttribute("fechaPedido", pedido.getFechaPedido());
                    model.addAttribute("total", pedido.getTotal());
                    model.addAttribute("estado", pedido.getEstado());
                    model.addAttribute("metodoPago", pedido.getMetodoPago());
                    model.addAttribute("tipoEntrega", pedido.getTipoEntrega());
                    model.addAttribute("direccionEntrega", pedido.getDireccionEntrega());

                    System.out.println(" Pedido encontrado: " + pedido.getId());
                    System.out.println(" Datos del pedido cargados en el modelo");

                    return "confirmacion-pedido";
                } else {
                    System.out.println(" Pedido no encontrado o no pertenece al usuario: " + id);
                    model.addAttribute("error", "Pedido no encontrado");
                }
            } else {
                System.out.println(" No se proporcionó ID de pedido");
                model.addAttribute("error", "No se especificó un pedido");
            }

            // Si no hay ID o no pertenece al usuario, mostrar página sin pedido específico
            System.out.println(" Mostrando página de confirmación sin pedido específico");
            model.addAttribute("usuario", usuario);
            return "confirmacion-pedido";

        } catch (Exception e) {
            System.err.println(" Error en confirmación: " + e.getMessage());
            model.addAttribute("error", "Error al cargar la confirmación");
            return "confirmacion-pedido";
        }
    }

    //  OBTENER PEDIDO POR ID (API)
    @GetMapping("/api/{pedidoId}")
    @ResponseBody
    public ResponseEntity<?> obtenerPedido(@PathVariable Long pedidoId, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario usuario = usuarioService.buscarPorCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Optional<Pedido> pedido = pedidoService.obtenerPedidoPorId(pedidoId);

            if (pedido.isPresent() && pedido.get().getUsuario().getId().equals(usuario.getId())) {
                return ResponseEntity.ok(pedido.get());
            } else {
                return ResponseEntity.status(404).body("Pedido no encontrado");
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Error al cargar el pedido: " + e.getMessage());
        }
    }

    //  OBTENER TODOS LOS PEDIDOS (API)
    @GetMapping("/api/pedidos")
    @ResponseBody
    public ResponseEntity<?> obtenerTodosLosPedidos() {
        try {
            List<Pedido> pedidos = pedidoService.obtenerTodosLosPedidos();

            if (pedidos.isEmpty()) {
                return ResponseEntity.ok().body(List.of());
            }

            return ResponseEntity.ok(pedidos);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Error al cargar los pedidos: " + e.getMessage());
        }
    }

    //  BUSCAR PEDIDO
    @PostMapping("/buscar")
    public String buscarPedido(@RequestParam String canalPedido,
                               @RequestParam String numeroPedido,
                               Model model) {
        System.out.println(" Buscando pedido - Número: " + numeroPedido);



        Optional<Pedido> pedido = pedidoService.buscarPorNumeroPedido(numeroPedido);

        if (pedido.isPresent()) {
            model.addAttribute("pedido", pedido.get());
            System.out.println(" Pedido encontrado: " + pedido.get().getId());
        } else {
            model.addAttribute("error", "No se encontró ningún pedido con el número: " + numeroPedido);
            System.out.println(" Pedido no encontrado");
        }

        return "sigue-tu-pedido";
    }

    //  OBTENER PEDIDOS DEL USUARIO ACTUAL
    @GetMapping("/mis-pedidos")
    @ResponseBody
    public ResponseEntity<?> obtenerMisPedidos(Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario usuario = usuarioService.buscarPorCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            List<Pedido> pedidos = pedidoService.obtenerPedidosPorUsuario(usuario.getId());
            return ResponseEntity.ok(pedidos);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Error al cargar los pedidos: " + e.getMessage());
        }
    }
}
