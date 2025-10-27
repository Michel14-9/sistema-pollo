package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import com.sistemaapollo.sistema_apollo.service.ProductoFinalService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
public class MenuController {

    private final ProductoFinalService productoFinalService;

    public MenuController(ProductoFinalService productoFinalService) {
        this.productoFinalService = productoFinalService;
    }

    @GetMapping("/menu")
    public String menuPublico(Model model) {
        // Obtener todos los productos de la base de datos
        List<ProductoFinal> todosProductos = productoFinalService.obtenerTodos();

        System.out.println("=== CARGANDO MENÚ PÚBLICO ===");
        System.out.println("Total de productos encontrados: " + todosProductos.size());

        // MOSTRAR TODAS LAS CATEGORÍAS QUE EXISTEN EN LA BD
        Set<String> categoriasUnicas = todosProductos.stream()
                .map(ProductoFinal::getTipo)
                .collect(Collectors.toSet());
        System.out.println("🔍 Categorías en BD: " + categoriasUnicas);

        // MOSTRAR CADA PRODUCTO CON SU CATEGORÍA
        todosProductos.forEach(producto -> {
            System.out.println("📦 Producto: '" + producto.getNombre() + "' - Categoría: '" + producto.getTipo() + "'");
        });

        // Filtrar productos por categorías - USAR minúsculas
        List<ProductoFinal> pollos = todosProductos.stream()
                .filter(p -> "pollos".equalsIgnoreCase(p.getTipo()))
                .toList();

        List<ProductoFinal> parrillas = todosProductos.stream()
                .filter(p -> "parrillas".equalsIgnoreCase(p.getTipo()))
                .toList();

        List<ProductoFinal> chicharron = todosProductos.stream()
                .filter(p -> "chicharron".equalsIgnoreCase(p.getTipo()) || "chicharrón".equalsIgnoreCase(p.getTipo()))
                .toList();

        List<ProductoFinal> broaster = todosProductos.stream()
                .filter(p -> "broaster".equalsIgnoreCase(p.getTipo()))
                .toList();

        List<ProductoFinal> hamburguesas = todosProductos.stream()
                .filter(p -> "hamburguesas".equalsIgnoreCase(p.getTipo()))
                .toList();

        List<ProductoFinal> criollos = todosProductos.stream()
                .filter(p -> "criollos".equalsIgnoreCase(p.getTipo()))
                .toList();

        List<ProductoFinal> combos = todosProductos.stream()
                .filter(p -> "combos".equalsIgnoreCase(p.getTipo()))
                .toList();

        // Mostrar en consola cuántos productos hay por categoría
        System.out.println("🐔 Pollos: " + pollos.size());
        System.out.println("🔥 Parrillas: " + parrillas.size());
        System.out.println("🐷 Chicharrón: " + chicharron.size());
        System.out.println("🍗 Broaster: " + broaster.size());
        System.out.println("🍔 Hamburguesas: " + hamburguesas.size());
        System.out.println("🇵🇪 Criollos: " + criollos.size());
        System.out.println("📦 Combos: " + combos.size());
        System.out.println("=============================");

        // Agregar las listas al modelo
        model.addAttribute("pollos", pollos);
        model.addAttribute("parrillas", parrillas);
        model.addAttribute("chicharron", chicharron);
        model.addAttribute("broaster", broaster);
        model.addAttribute("hamburguesas", hamburguesas);
        model.addAttribute("criollos", criollos);
        model.addAttribute("combos", combos);
        model.addAttribute("pagina", "menu-publico");

        return "menu";
    }
}