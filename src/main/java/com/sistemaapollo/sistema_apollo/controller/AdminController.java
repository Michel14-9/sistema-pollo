package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import com.sistemaapollo.sistema_apollo.service.ProductoFinalService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/admin-menu")
public class AdminController {

    private final ProductoFinalService productoFinalService;

    public AdminController(ProductoFinalService productoFinalService) {
        this.productoFinalService = productoFinalService;
    }

    // Página principal del admin - MOSTRAR PRODUCTOS
    @GetMapping("")
    public String adminMenu(Model model) {
        List<ProductoFinal> productos = productoFinalService.obtenerTodos();
        model.addAttribute("productos", productos);
        model.addAttribute("pagina", "dashboard");
        return "admin-menu";
    }

    // Mostrar formulario para nuevo producto
    @GetMapping("/nuevo")
    public String nuevoProducto(Model model) {
        model.addAttribute("pagina", "nuevo-producto");
        model.addAttribute("producto", new ProductoFinal());
        return "nuevo-producto";
    }

    // Procesar el formulario de nuevo producto (POST) - CORREGIDO
    @PostMapping("/guardar")
    public String guardarProducto(
            @RequestParam String nombre,
            @RequestParam String descripcion,
            @RequestParam Double precio,
            @RequestParam String tipo,
            @RequestParam(required = false) String imagenUrl, // PARÁMETRO PARA URL
            RedirectAttributes redirectAttributes) {

        try {
            // Validar datos básicos
            if (nombre == null || nombre.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El nombre del producto es requerido");
                return "redirect:/admin-menu/nuevo";
            }

            if (precio == null || precio <= 0) {
                redirectAttributes.addFlashAttribute("error", "El precio debe ser mayor a 0");
                return "redirect:/admin-menu/nuevo";
            }

            if (tipo == null || tipo.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El tipo/categoría es requerido");
                return "redirect:/admin-menu/nuevo";
            }

            // Crear nuevo producto
            ProductoFinal producto = new ProductoFinal();
            producto.setNombre(nombre.trim());
            producto.setDescripcion(descripcion != null ? descripcion.trim() : "");
            producto.setPrecio(precio);
            producto.setTipo(tipo.trim());

            // Manejar imagen URL - si está vacía, usar valor por defecto
            if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
                producto.setImagenUrl(imagenUrl.trim());
            } else {
                producto.setImagenUrl("/imagenes/default-product.jpg");
            }

            // Guardar en la base de datos
            ProductoFinal productoCreado = productoFinalService.guardar(producto);

            System.out.println("=== NUEVO PRODUCTO GUARDADO EN BD ===");
            System.out.println("ID: " + productoCreado.getId());
            System.out.println("Nombre: " + productoCreado.getNombre());
            System.out.println("Precio: S/." + productoCreado.getPrecio());
            System.out.println("Tipo: " + productoCreado.getTipo());
            System.out.println("Imagen: " + productoCreado.getImagenUrl());
            System.out.println("===============================");

            redirectAttributes.addFlashAttribute("success", "Producto guardado exitosamente!");

        } catch (Exception e) {
            System.err.println("Error al guardar producto: " + e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Error al guardar el producto: " + e.getMessage());
            return "redirect:/admin-menu/nuevo";
        }

        return "redirect:/admin-menu";
    }

    // Editar producto existente
    @GetMapping("/editar/{id}")
    public String editarProducto(@PathVariable Long id, Model model) {
        try {
            Optional<ProductoFinal> productoOpt = productoFinalService.obtenerPorId(id);
            if (productoOpt.isPresent()) {
                model.addAttribute("producto", productoOpt.get());
                model.addAttribute("pagina", "editar-producto");
                return "nuevo-producto";
            } else {
                model.addAttribute("error", "Producto no encontrado");
                return "redirect:/admin-menu";
            }
        } catch (Exception e) {
            model.addAttribute("error", "Error al cargar el producto");
            return "redirect:/admin-menu";
        }
    }

    // Actualizar producto existente
    @PostMapping("/actualizar/{id}")
    public String actualizarProducto(
            @PathVariable Long id,
            @RequestParam String nombre,
            @RequestParam String descripcion,
            @RequestParam Double precio,
            @RequestParam String tipo,
            @RequestParam(required = false) String imagenUrl,
            RedirectAttributes redirectAttributes) {

        try {
            Optional<ProductoFinal> productoOpt = productoFinalService.obtenerPorId(id);
            if (productoOpt.isPresent()) {
                ProductoFinal producto = productoOpt.get();
                producto.setNombre(nombre);
                producto.setDescripcion(descripcion);
                producto.setPrecio(precio);
                producto.setTipo(tipo);

                // Actualizar imagen URL solo si se proporciona
                if (imagenUrl != null && !imagenUrl.trim().isEmpty()) {
                    producto.setImagenUrl(imagenUrl.trim());
                }

                productoFinalService.guardar(producto);
                redirectAttributes.addFlashAttribute("success", "Producto actualizado exitosamente!");
            } else {
                redirectAttributes.addFlashAttribute("error", "Producto no encontrado");
            }

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al actualizar el producto");
        }
        return "redirect:/admin-menu";
    }

    // Eliminar producto
    @PostMapping("/eliminar/{id}")
    public String eliminarProducto(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            productoFinalService.eliminar(id);
            redirectAttributes.addFlashAttribute("success", "Producto eliminado exitosamente!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al eliminar el producto");
        }
        return "redirect:/admin-menu";
    }
}
