package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.Pedido;
import com.sistemaapollo.sistema_apollo.model.ItemPedido;
import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import com.sistemaapollo.sistema_apollo.repository.PedidoRepository;
import com.sistemaapollo.sistema_apollo.repository.UsuarioRepository;
import com.sistemaapollo.sistema_apollo.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin-menu/reportes")
public class ReportesController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Obtener reporte de ventas por rango de fechas
     */
    @GetMapping("/ventas")
    public ResponseEntity<?> obtenerReporteVentas(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {

        try {
            System.out.println("Generando reporte de ventas - Fechas: " + fechaInicio + " a " + fechaFin);

            Map<String, Object> reporte = new HashMap<>();

            // Obtener rango de fechas
            LocalDateTime[] rangoFechas = obtenerRangoFechas(fechaInicio, fechaFin);
            LocalDateTime inicio = rangoFechas[0];
            LocalDateTime fin = rangoFechas[1];


            List<Pedido> todosPedidos = pedidoRepository.findAllWithItemsAndProducts();
            System.out.println(" Total de pedidos encontrados: " + todosPedidos.size());

            // Filtrar pedidos por fecha
            List<Pedido> pedidosFiltrados = todosPedidos.stream()
                    .filter(p -> p.getFecha() != null &&
                            !p.getFecha().isBefore(inicio) &&
                            !p.getFecha().isAfter(fin))
                    .collect(Collectors.toList());

            System.out.println(" Pedidos filtrados: " + pedidosFiltrados.size());

            // Calcular métricas
            double totalVentas = pedidosFiltrados.stream()
                    .filter(p -> "ENTREGADO".equals(p.getEstado()))
                    .mapToDouble(Pedido::getTotal)
                    .sum();

            long totalPedidos = pedidosFiltrados.size();

            long productosVendidos = pedidosFiltrados.stream()
                    .flatMap(p -> p.getItems().stream())
                    .mapToLong(item -> item.getCantidad() != null ? item.getCantidad().longValue() : 0L)
                    .sum();

            // Calcular crecimiento
            double crecimiento = calcularCrecimientoVentas(inicio, fin);

            // Datos para gráfico de ventas por día
            Map<String, Double> ventasPorDia = calcularVentasPorDia(pedidosFiltrados, inicio, fin);

            // Datos para gráfico de categorías
            Map<String, Double> ventasPorCategoria = calcularVentasPorCategoria(pedidosFiltrados);

            // Datos para tabla detallada
            List<Map<String, Object>> tablaDatos = generarTablaVentas(pedidosFiltrados);

            // Preparar respuesta
            Map<String, Object> metricas = new HashMap<>();
            metricas.put("totalVentas", totalVentas);
            metricas.put("totalPedidos", totalPedidos);
            metricas.put("productosVendidos", productosVendidos);
            metricas.put("crecimiento", crecimiento);

            Map<String, Object> datosGrafico = new HashMap<>();
            datosGrafico.put("labels", new ArrayList<>(ventasPorDia.keySet()));
            datosGrafico.put("datos", new ArrayList<>(ventasPorDia.values()));

            Map<String, Object> datosCategoria = new HashMap<>();
            datosCategoria.put("labels", new ArrayList<>(ventasPorCategoria.keySet()));
            datosCategoria.put("datos", new ArrayList<>(ventasPorCategoria.values()));

            reporte.put("metricas", metricas);
            reporte.put("datosGrafico", datosGrafico);
            reporte.put("datosCategoria", datosCategoria);
            reporte.put("tablaDatos", tablaDatos);
            reporte.put("success", true);

            System.out.println(" Reporte de ventas generado exitosamente");

            return ResponseEntity.ok(reporte);

        } catch (Exception e) {
            System.err.println(" Error en reporte de ventas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", "Error al generar reporte: " + e.getMessage()));
        }
    }

    /**
     * Obtener reporte de productos más vendidos
     */
    @GetMapping("/productos")
    public ResponseEntity<?> obtenerReporteProductos(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {

        try {
            System.out.println(" Generando reporte de productos - Fechas: " + fechaInicio + " a " + fechaFin);

            Map<String, Object> reporte = new HashMap<>();

            // Obtener rango de fechas
            LocalDateTime[] rangoFechas = obtenerRangoFechas(fechaInicio, fechaFin);
            LocalDateTime inicio = rangoFechas[0];
            LocalDateTime fin = rangoFechas[1];


            List<Pedido> todosPedidos = pedidoRepository.findAllWithItemsAndProducts();
            List<Pedido> pedidosFiltrados = todosPedidos.stream()
                    .filter(p -> p.getFecha() != null &&
                            !p.getFecha().isBefore(inicio) &&
                            !p.getFecha().isAfter(fin))
                    .collect(Collectors.toList());

            // Calcular productos más vendidos
            Map<String, ProductoVendido> productosMap = new HashMap<>();

            for (Pedido pedido : pedidosFiltrados) {
                for (ItemPedido item : pedido.getItems()) {
                    String nombreProducto = item.getNombreProductoSeguro();

                    // OBTENER CATEGORÍA REAL del ProductoFinal
                    String categoria = "General";
                    if (item.getProductoFinal() != null && item.getProductoFinal().getTipo() != null) {
                        categoria = item.getProductoFinal().getTipo();
                        System.out.println(" Categoría encontrada: " + categoria + " para producto: " + nombreProducto);
                    } else {
                        categoria = inferirCategoriaDeNombre(nombreProducto);
                        System.out.println("Categoría inferida: " + categoria + " para producto: " + nombreProducto);
                    }

                    ProductoVendido producto = productosMap.getOrDefault(nombreProducto,
                            new ProductoVendido(nombreProducto, categoria));

                    producto.agregarVenta(item.getCantidad(), item.getSubtotal());
                    productosMap.put(nombreProducto, producto);
                }
            }

            // Convertir a lista y ordenar por cantidad vendida
            List<ProductoVendido> productosVendidos = new ArrayList<>(productosMap.values());
            productosVendidos.sort((a, b) -> Long.compare(b.getCantidad(), a.getCantidad()));

            // Calcular métricas
            double totalVentas = productosVendidos.stream()
                    .mapToDouble(ProductoVendido::getIngresos)
                    .sum();

            long totalPedidos = pedidosFiltrados.size();
            long totalProductosVendidos = productosVendidos.stream()
                    .mapToLong(ProductoVendido::getCantidad)
                    .sum();

            double crecimiento = calcularCrecimientoProductos(inicio, fin);

            // Preparar datos para tabla (limitar a 50 productos)
            List<Map<String, Object>> tablaDatos = new ArrayList<>();
            for (ProductoVendido p : productosVendidos.stream().limit(50).collect(Collectors.toList())) {
                Map<String, Object> fila = new HashMap<>();
                fila.put("producto", p.getNombre());
                fila.put("categoria", p.getCategoria());
                fila.put("vendidos", p.getCantidad());
                fila.put("ingresos", p.getIngresos());
                tablaDatos.add(fila);
            }

            // Datos para gráfico (top 8 productos)
            Map<String, Double> topProductos = new HashMap<>();
            for (ProductoVendido p : productosVendidos.stream().limit(8).collect(Collectors.toList())) {
                topProductos.put(p.getNombre(), p.getIngresos());
            }

            // Preparar respuesta
            Map<String, Object> metricas = new HashMap<>();
            metricas.put("totalVentas", totalVentas);
            metricas.put("totalPedidos", totalPedidos);
            metricas.put("productosVendidos", totalProductosVendidos);
            metricas.put("crecimiento", crecimiento);

            Map<String, Object> datosGrafico = new HashMap<>();
            datosGrafico.put("labels", new ArrayList<>(topProductos.keySet()));
            datosGrafico.put("datos", new ArrayList<>(topProductos.values()));

            reporte.put("metricas", metricas);
            reporte.put("datosGrafico", datosGrafico);
            reporte.put("tablaDatos", tablaDatos);
            reporte.put("success", true);

            System.out.println(" Reporte de productos generado exitosamente");

            return ResponseEntity.ok(reporte);

        } catch (Exception e) {
            System.err.println("Error en reporte de productos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", "Error al generar reporte: " + e.getMessage()));
        }
    }

    /**
     * Obtener reporte de actividad de usuarios
     */
    @GetMapping("/usuarios")
    public ResponseEntity<?> obtenerReporteUsuarios(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {

        try {
            System.out.println("👥 Generando reporte de usuarios - Fechas: " + fechaInicio + " a " + fechaFin);

            Map<String, Object> reporte = new HashMap<>();

            // Obtener rango de fechas
            LocalDateTime[] rangoFechas = obtenerRangoFechas(fechaInicio, fechaFin);
            LocalDateTime inicio = rangoFechas[0];
            LocalDateTime fin = rangoFechas[1];


            List<Pedido> todosPedidos = pedidoRepository.findAllWithItemsAndProducts();
            List<Usuario> todosUsuarios = usuarioRepository.findAll();

            // Filtrar pedidos por fecha
            List<Pedido> pedidosFiltrados = todosPedidos.stream()
                    .filter(p -> p.getFecha() != null &&
                            !p.getFecha().isBefore(inicio) &&
                            !p.getFecha().isAfter(fin))
                    .collect(Collectors.toList());

            // Calcular actividad por usuario
            Map<Long, ActividadUsuario> actividadMap = new HashMap<>();

            for (Pedido pedido : pedidosFiltrados) {
                if (pedido.getUsuario() != null) {
                    Long usuarioId = pedido.getUsuario().getId();
                    ActividadUsuario actividad = actividadMap.getOrDefault(usuarioId,
                            new ActividadUsuario(pedido.getUsuario()));

                    actividad.agregarPedido(pedido.getTotal());
                    actividadMap.put(usuarioId, actividad);
                }
            }

            // Convertir a lista y ordenar
            List<ActividadUsuario> actividadUsuarios = new ArrayList<>(actividadMap.values());
            actividadUsuarios.sort((a, b) -> Long.compare(b.getTotalPedidos(), a.getTotalPedidos()));

            // Calcular métricas
            long totalUsuariosActivos = actividadUsuarios.size();
            long totalPedidos = pedidosFiltrados.size();
            double totalVentas = pedidosFiltrados.stream()
                    .filter(p -> "ENTREGADO".equals(p.getEstado()))
                    .mapToDouble(Pedido::getTotal)
                    .sum();

            // Preparar datos para tabla
            List<Map<String, Object>> tablaDatos = new ArrayList<>();
            for (ActividadUsuario a : actividadUsuarios) {
                Map<String, Object> fila = new HashMap<>();
                fila.put("usuario", a.getNombreCompleto());
                fila.put("rol", a.getRol());
                fila.put("pedidos", a.getTotalPedidos());
                fila.put("totalGastado", a.getTotalGastado());
                tablaDatos.add(fila);
            }

            // Datos para gráfico (actividad por rol)
            Map<String, Long> actividadPorRol = new HashMap<>();
            for (ActividadUsuario a : actividadUsuarios) {
                String rol = a.getRol();
                actividadPorRol.put(rol, actividadPorRol.getOrDefault(rol, 0L) + a.getTotalPedidos());
            }

            // Preparar respuesta
            Map<String, Object> metricas = new HashMap<>();
            metricas.put("totalVentas", totalVentas);
            metricas.put("totalPedidos", totalPedidos);
            metricas.put("usuariosActivos", totalUsuariosActivos);
            metricas.put("crecimiento", 0.0);

            Map<String, Object> datosGrafico = new HashMap<>();
            datosGrafico.put("labels", new ArrayList<>(actividadPorRol.keySet()));
            datosGrafico.put("datos", new ArrayList<>(actividadPorRol.values()));

            reporte.put("metricas", metricas);
            reporte.put("datosGrafico", datosGrafico);
            reporte.put("tablaDatos", tablaDatos);
            reporte.put("success", true);

            System.out.println(" Reporte de usuarios generado exitosamente");

            return ResponseEntity.ok(reporte);

        } catch (Exception e) {
            System.err.println(" Error en reporte de usuarios: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", "Error al generar reporte: " + e.getMessage()));
        }
    }

    // ================== MÉTODOS AUXILIARES ==================

    private LocalDateTime[] obtenerRangoFechas(String fechaInicio, String fechaFin) {
        LocalDateTime inicio;
        LocalDateTime fin;

        if (fechaInicio != null && fechaFin != null && !fechaInicio.isEmpty() && !fechaFin.isEmpty()) {
            // Usar fechas proporcionadas
            inicio = LocalDate.parse(fechaInicio).atStartOfDay();
            fin = LocalDate.parse(fechaFin).atTime(23, 59, 59);
        } else {
            // Por defecto: último mes
            fin = LocalDateTime.now();
            inicio = fin.minusMonths(1);
        }

        System.out.println(" Rango de fechas: " + inicio + " a " + fin);
        return new LocalDateTime[]{inicio, fin};
    }

    private double calcularCrecimientoVentas(LocalDateTime inicio, LocalDateTime fin) {
        try {
            // Período actual
            List<Pedido> pedidosActual = pedidoRepository.findAll().stream()
                    .filter(p -> p.getFecha() != null &&
                            !p.getFecha().isBefore(inicio) &&
                            !p.getFecha().isAfter(fin) &&
                            "ENTREGADO".equals(p.getEstado()))
                    .collect(Collectors.toList());

            double ventasActual = pedidosActual.stream()
                    .mapToDouble(Pedido::getTotal)
                    .sum();

            // Período anterior (misma duración)
            long dias = java.time.Duration.between(inicio, fin).toDays();
            LocalDateTime inicioAnterior = inicio.minusDays(dias);
            LocalDateTime finAnterior = inicio.minusSeconds(1);

            List<Pedido> pedidosAnterior = pedidoRepository.findAll().stream()
                    .filter(p -> p.getFecha() != null &&
                            !p.getFecha().isBefore(inicioAnterior) &&
                            !p.getFecha().isAfter(finAnterior) &&
                            "ENTREGADO".equals(p.getEstado()))
                    .collect(Collectors.toList());

            double ventasAnterior = pedidosAnterior.stream()
                    .mapToDouble(Pedido::getTotal)
                    .sum();

            if (ventasAnterior == 0) return ventasActual > 0 ? 100.0 : 0.0;

            double crecimiento = ((ventasActual - ventasAnterior) / ventasAnterior) * 100;
            System.out.println(" Crecimiento calculado: " + crecimiento + "%");

            return crecimiento;

        } catch (Exception e) {
            System.err.println(" Error calculando crecimiento: " + e.getMessage());
            return 0.0;
        }
    }

    private double calcularCrecimientoProductos(LocalDateTime inicio, LocalDateTime fin) {
        // Por simplicidad, usar mismo cálculo que ventas
        return calcularCrecimientoVentas(inicio, fin);
    }

    private Map<String, Double> calcularVentasPorDia(List<Pedido> pedidos, LocalDateTime inicio, LocalDateTime fin) {
        Map<String, Double> ventasPorDia = new LinkedHashMap<>();

        LocalDate fechaActual = inicio.toLocalDate();
        LocalDate fechaFin = fin.toLocalDate();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

        while (!fechaActual.isAfter(fechaFin)) {
            LocalDateTime inicioDia = fechaActual.atStartOfDay();
            LocalDateTime finDia = fechaActual.atTime(23, 59, 59);
            String clave = fechaActual.format(formatter);

            double ventasDia = pedidos.stream()
                    .filter(p -> p.getFecha() != null &&
                            !p.getFecha().isBefore(inicioDia) &&
                            !p.getFecha().isAfter(finDia) &&
                            "ENTREGADO".equals(p.getEstado()))
                    .mapToDouble(Pedido::getTotal)
                    .sum();

            ventasPorDia.put(clave, ventasDia);
            fechaActual = fechaActual.plusDays(1);
        }

        System.out.println(" Ventas por día calculadas: " + ventasPorDia.size() + " días");
        return ventasPorDia;
    }

    private Map<String, Double> calcularVentasPorCategoria(List<Pedido> pedidos) {
        Map<String, Double> ventasPorCategoria = new HashMap<>();

        for (Pedido pedido : pedidos) {
            if ("ENTREGADO".equals(pedido.getEstado())) {
                for (ItemPedido item : pedido.getItems()) {

                    System.out.println(" Item: " + item.getNombreProductoSeguro());
                    System.out.println(" ProductoFinal: " + (item.getProductoFinal() != null ? "EXISTE" : "NULL"));
                    if (item.getProductoFinal() != null) {
                        System.out.println(" Nombre: " + item.getProductoFinal().getNombre());
                        System.out.println("Categoría: " + item.getProductoFinal().getTipo());
                    }

                    String categoria = "General";
                    if (item.getProductoFinal() != null && item.getProductoFinal().getTipo() != null) {
                        categoria = item.getProductoFinal().getTipo();
                        System.out.println(" Usando categoría real: " + categoria);
                    } else {
                        categoria = inferirCategoriaDeNombre(item.getNombreProductoSeguro());
                        System.out.println(" Usando categoría inferida: " + categoria);
                    }

                    double subtotal = item.getSubtotal() != null ? item.getSubtotal() : 0.0;
                    ventasPorCategoria.put(categoria, ventasPorCategoria.getOrDefault(categoria, 0.0) + subtotal);
                }
            }
        }

        System.out.println(" Ventas por categoría calculadas: " + ventasPorCategoria.size() + " categorías");
        System.out.println("Categorías encontradas: " + ventasPorCategoria.keySet());
        return ventasPorCategoria;
    }

    // Método auxiliar para inferir categoría del nombre del producto
    private String inferirCategoriaDeNombre(String nombreProducto) {
        if (nombreProducto == null) return "General";

        String nombreLower = nombreProducto.toLowerCase();

        if (nombreLower.contains("pollo") || nombreLower.contains("broaster") || nombreLower.contains("crispy")) {
            return "Pollos";
        } else if (nombreLower.contains("parrilla") || nombreLower.contains("lomo") || nombreLower.contains("asado")) {
            return "Parrillas";
        } else if (nombreLower.contains("chicharrón") || nombreLower.contains("chicharron")) {
            return "Chicharrón";
        } else if (nombreLower.contains("hamburguesa") || nombreLower.contains("burger")) {
            return "Hamburguesas";
        } else if (nombreLower.contains("combo") || nombreLower.contains("promo")) {
            return "Combos";
        } else if (nombreLower.contains("criollo") || nombreLower.contains("seco") || nombreLower.contains("arroz")) {
            return "Criollos";
        } else {
            return "General";
        }
    }

    private List<Map<String, Object>> generarTablaVentas(List<Pedido> pedidos) {
        List<Map<String, Object>> tabla = new ArrayList<>();

        for (Pedido p : pedidos.stream()
                .sorted((a, b) -> b.getFecha().compareTo(a.getFecha()))
                .limit(100)
                .collect(Collectors.toList())) {

            String productos = p.getItems().stream()
                    .map(item -> item.getNombreProductoSeguro() + " (x" + item.getCantidad() + ")")
                    .collect(Collectors.joining(", "));

            String cliente = p.getUsuario() != null ?
                    p.getUsuario().getNombres() + " " + p.getUsuario().getApellidos() :
                    "Cliente general";

            Map<String, Object> fila = new HashMap<>();
            fila.put("id", p.getId());
            fila.put("fecha", p.getFecha().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
            fila.put("cliente", cliente);
            fila.put("productos", productos);
            fila.put("total", p.getTotal());
            fila.put("estado", p.getEstado());

            tabla.add(fila);
        }

        System.out.println(" Tabla de ventas generada: " + tabla.size() + " registros");
        return tabla;
    }

    // ================== CLASES AUXILIARES ==================

    private static class ProductoVendido {
        private String nombre;
        private String categoria;
        private long cantidad;
        private double ingresos;

        public ProductoVendido(String nombre, String categoria) {
            this.nombre = nombre;
            this.categoria = categoria;
            this.cantidad = 0;
            this.ingresos = 0;
        }

        public void agregarVenta(Integer cantidad, Double subtotal) {
            this.cantidad += cantidad != null ? cantidad : 0;
            this.ingresos += subtotal != null ? subtotal : 0.0;
        }

        // Getters
        public String getNombre() { return nombre; }
        public String getCategoria() { return categoria; }
        public long getCantidad() { return cantidad; }
        public double getIngresos() { return ingresos; }
    }

    private static class ActividadUsuario {
        private Usuario usuario;
        private long totalPedidos;
        private double totalGastado;

        public ActividadUsuario(Usuario usuario) {
            this.usuario = usuario;
            this.totalPedidos = 0;
            this.totalGastado = 0;
        }

        public void agregarPedido(Double total) {
            this.totalPedidos++;
            this.totalGastado += total != null ? total : 0.0;
        }

        // Getters
        public String getNombreCompleto() {
            return usuario.getNombres() + " " + usuario.getApellidos();
        }

        public String getRol() {
            return usuario.getRol();
        }

        public long getTotalPedidos() { return totalPedidos; }
        public double getTotalGastado() { return totalGastado; }
    }
}