package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import com.sistemaapollo.sistema_apollo.service.ProductoFinalService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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


    @GetMapping("/exportar-dashboard-excel")
    public void exportarDashboardExcel(HttpServletResponse response) throws IOException {
        try {
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "dashboard_apollo_" + timestamp + ".xlsx";
            response.setHeader("Content-Disposition", "attachment; filename=" + filename);

            List<ProductoFinal> productos = productoFinalService.obtenerTodos();

            Workbook workbook = new XSSFWorkbook();

            //  RESUMEN DEL DASHBOARD
            Sheet resumenSheet = workbook.createSheet("Resumen Dashboard");

            // Estilo para títulos
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleStyle.setFont(titleFont);

            // Estilo para métricas
            CellStyle metricStyle = workbook.createCellStyle();
            metricStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            metricStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font metricFont = workbook.createFont();
            metricFont.setBold(true);
            metricStyle.setFont(metricFont);

            // Título del reporte
            Row titleRow = resumenSheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE DASHBOARD - SISTEMA APOLLO");
            titleCell.setCellStyle(titleStyle);

            // Métricas principales
            int rowNum = 2;
            String[][] metrics = {
                    {"Total de Productos", String.valueOf(productos.size())},
                    {"Precio Promedio", "S/. " + String.format("%.2f", productos.stream().mapToDouble(ProductoFinal::getPrecio).average().orElse(0.0))},
                    {"Producto Más Caro", "S/. " + String.format("%.2f", productos.stream().mapToDouble(ProductoFinal::getPrecio).max().orElse(0.0))},
                    {"Producto Más Económico", "S/. " + String.format("%.2f", productos.stream().mapToDouble(ProductoFinal::getPrecio).min().orElse(0.0))},
                    {"Valor Total del Inventario", "S/. " + String.format("%.2f", productos.stream().mapToDouble(ProductoFinal::getPrecio).sum())},
                    {"Fecha de Generación", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))}
            };

            for (String[] metric : metrics) {
                Row metricRow = resumenSheet.createRow(rowNum++);
                metricRow.createCell(0).setCellValue(metric[0]);
                Cell valueCell = metricRow.createCell(1);
                valueCell.setCellValue(metric[1]);
                valueCell.setCellStyle(metricStyle);
            }

            //  ESTADÍSTICAS POR CATEGORÍA
            Sheet statsSheet = workbook.createSheet("Estadísticas por Categoría");

            // Encabezados
            Row statsHeader = statsSheet.createRow(0);
            String[] statsHeaders = {"Categoría", "Cantidad", "Precio Promedio", "Precio Máx", "Precio Mín", "Valor Total"};

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < statsHeaders.length; i++) {
                Cell cell = statsHeader.createCell(i);
                cell.setCellValue(statsHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            // Agrupar por categoría y calcular estadísticas
            Map<String, List<ProductoFinal>> productosPorCategoria = productos.stream()
                    .collect(Collectors.groupingBy(ProductoFinal::getTipo));

            int statsRowNum = 1;
            for (Map.Entry<String, List<ProductoFinal>> entry : productosPorCategoria.entrySet()) {
                String categoria = entry.getKey();
                List<ProductoFinal> productosCategoria = entry.getValue();

                double promedio = productosCategoria.stream()
                        .mapToDouble(ProductoFinal::getPrecio)
                        .average()
                        .orElse(0.0);
                double maxPrecio = productosCategoria.stream()
                        .mapToDouble(ProductoFinal::getPrecio)
                        .max()
                        .orElse(0.0);
                double minPrecio = productosCategoria.stream()
                        .mapToDouble(ProductoFinal::getPrecio)
                        .min()
                        .orElse(0.0);
                double valorTotal = productosCategoria.stream()
                        .mapToDouble(ProductoFinal::getPrecio)
                        .sum();

                Row statsRow = statsSheet.createRow(statsRowNum++);
                statsRow.createCell(0).setCellValue(categoria);
                statsRow.createCell(1).setCellValue(productosCategoria.size());
                statsRow.createCell(2).setCellValue(promedio);
                statsRow.createCell(3).setCellValue(maxPrecio);
                statsRow.createCell(4).setCellValue(minPrecio);
                statsRow.createCell(5).setCellValue(valorTotal);
            }

            // LISTA COMPLETA DE PRODUCTOS (como respaldo)
            Sheet productosSheet = workbook.createSheet("Todos los Productos");
            Row productosHeader = productosSheet.createRow(0);
            String[] productosHeaders = {"ID", "Nombre", "Categoría", "Precio", "Descripción"};

            for (int i = 0; i < productosHeaders.length; i++) {
                Cell cell = productosHeader.createCell(i);
                cell.setCellValue(productosHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            int productosRowNum = 1;
            for (ProductoFinal producto : productos) {
                Row row = productosSheet.createRow(productosRowNum++);
                row.createCell(0).setCellValue(producto.getId());
                row.createCell(1).setCellValue(producto.getNombre());
                row.createCell(2).setCellValue(producto.getTipo());
                row.createCell(3).setCellValue(producto.getPrecio());
                row.createCell(4).setCellValue(producto.getDescripcion() != null ? producto.getDescripcion() : "");
            }

            // Autoajustar columnas en todas las hojas
            for (int i = 0; i < 6; i++) {
                resumenSheet.autoSizeColumn(i);
                statsSheet.autoSizeColumn(i);
                if (i < 5) productosSheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
            workbook.close();

            System.out.println(" Reporte Dashboard Excel generado: " + filename);

        } catch (Exception e) {
            System.err.println(" Error al generar reporte dashboard: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error al generar el reporte del dashboard");
        }
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