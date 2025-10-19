package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import com.sistemaapollo.sistema_apollo.service.ProductoFinalService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

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

        // Filtrar productos por categorías
        List<ProductoFinal> pollos = todosProductos.stream()
                .filter(p -> "Pollos".equals(p.getTipo()))
                .toList();

        List<ProductoFinal> parrillas = todosProductos.stream()
                .filter(p -> "Parrillas".equals(p.getTipo()))
                .toList();

        List<ProductoFinal> chicharron = todosProductos.stream()
                .filter(p -> "Chicharrón".equals(p.getTipo()))
                .toList();

        List<ProductoFinal> broaster = todosProductos.stream()
                .filter(p -> "Broaster".equals(p.getTipo()))
                .toList();

        List<ProductoFinal> hamburguesas = todosProductos.stream()
                .filter(p -> "Hamburguesas".equals(p.getTipo()))
                .toList();

        List<ProductoFinal> criollos = todosProductos.stream()
                .filter(p -> "Criollos".equals(p.getTipo()))
                .toList();

        List<ProductoFinal> combos = todosProductos.stream()
                .filter(p -> "Combos".equals(p.getTipo()))
                .toList();

        // Mostrar en consola cuántos productos hay por categoría
        System.out.println("Pollos: " + pollos.size());
        System.out.println("Parrillas: " + parrillas.size());
        System.out.println("Chicharrón: " + chicharron.size());
        System.out.println("Broaster: " + broaster.size());
        System.out.println("Hamburguesas: " + hamburguesas.size());
        System.out.println("Criollos: " + criollos.size());
        System.out.println("Combos: " + combos.size());
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
