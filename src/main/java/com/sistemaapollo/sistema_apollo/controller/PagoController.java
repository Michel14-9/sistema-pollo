package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.CarritoItem;
import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.model.Direccion;
import com.sistemaapollo.sistema_apollo.service.CarritoService;
import com.sistemaapollo.sistema_apollo.service.UsuarioService;
import com.sistemaapollo.sistema_apollo.service.DireccionService; // Importar el servicio
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/pago")
public class PagoController {

    private final CarritoService carritoService;
    private final UsuarioService usuarioService;
    private final DireccionService direccionService; //  Agregar el servicio

    // Modificar constructor para incluir DireccionService
    public PagoController(CarritoService carritoService,
                          UsuarioService usuarioService,
                          DireccionService direccionService) { //  Agregar parámetro
        this.carritoService = carritoService;
        this.usuarioService = usuarioService;
        this.direccionService = direccionService; //  Inicializar
    }

    @GetMapping
    public String mostrarPaginaPago(Authentication authentication, Model model) {
        try {
            //  Verificar autenticación
            if (authentication == null || !authentication.isAuthenticated()) {
                return "redirect:/login";
            }

            String correo = authentication.getName();
            Usuario usuario = usuarioService.buscarPorCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Long usuarioId = usuario.getId();

            // Obtener carrito del usuario
            List<CarritoItem> carrito = carritoService.obtenerCarrito(usuarioId);

            //  Asegurar que carrito nunca sea null
            if (carrito == null) {
                carrito = new ArrayList<>();
            }

            //  OBTENER DIRECCIONES DEL USUARIO
            List<Direccion> direcciones = new ArrayList<>();
            Direccion direccionPredeterminada = null;

            try {
                direcciones = direccionService.obtenerDireccionesUsuario(correo);
                Optional<Direccion> predeterminadaOpt = direccionService.obtenerDireccionPredeterminada(correo);
                if (predeterminadaOpt.isPresent()) {
                    direccionPredeterminada = predeterminadaOpt.get();
                }
                System.out.println(" Direcciones encontradas: " + direcciones.size());
                if (direccionPredeterminada != null) {
                    System.out.println(" Dirección predeterminada: " + direccionPredeterminada.getDireccion());
                }
            } catch (Exception e) {
                System.err.println(" Error al cargar direcciones: " + e.getMessage());
                // No romper el flujo si hay error en direcciones
            }

            double subtotal = 0.0;
            double costoEnvio = 0.0;
            double descuento = 0.0;
            double total = 0.0;

            //  Solo calcular si hay productos en el carrito
            if (!carrito.isEmpty()) {
                subtotal = carrito.stream()
                        .mapToDouble(item -> item.getPrecioUnitario() * item.getCantidad())
                        .sum();

                costoEnvio = subtotal >= 50 ? 0 : 5;
                descuento = subtotal >= 80 ? 10 : 0;
                total = subtotal + costoEnvio - descuento;
            }

            //  Agregar datos al modelo (siempre)
            model.addAttribute("usuario", usuario);
            model.addAttribute("carrito", carrito);
            model.addAttribute("subtotal", subtotal);
            model.addAttribute("costoEnvio", costoEnvio);
            model.addAttribute("descuento", descuento);
            model.addAttribute("total", total);
            model.addAttribute("cantidadItems", carrito.size());

            //  AGREGAR DIRECCIONES AL MODELO
            model.addAttribute("direcciones", direcciones);
            model.addAttribute("direccionPredeterminada", direccionPredeterminada);

            System.out.println("=== PAGO CONTROLLER - DATOS CARGADOS ===");
            System.out.println("Usuario: " + usuario.getNombres());
            System.out.println("Carrito items: " + carrito.size());
            System.out.println("Direcciones: " + direcciones.size());

            return "pago";

        } catch (Exception e) {
            System.err.println("❌ ERROR en PagoController: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/carrito?error=pago_error";
        }
    }
}
