package com.sistemaapollo.sistema_apollo.controller;

import com.sistemaapollo.sistema_apollo.model.Pedido;
import com.sistemaapollo.sistema_apollo.service.PedidoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Controller
@RequestMapping("/sigue-tu-pedido")
public class SigueTuPedidoController {

    private final PedidoService pedidoService;

    public SigueTuPedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }


    @GetMapping
    public String mostrarPaginaSeguimiento() {
        return "sigue-tu-pedido";
    }


    @PostMapping("/buscar")
    public String buscarPedido(@RequestParam(required = false) String canalPedido,
                               @RequestParam String numeroPedido,
                               Model model) {
        try {
            System.out.println(" Buscando pedido - Número: " + numeroPedido);


            Optional<Pedido> pedidoOpt = pedidoService.buscarPorNumeroPedido(numeroPedido);

            if (!pedidoOpt.isPresent()) {

                if (canalPedido != null && !canalPedido.trim().isEmpty()) {
                    System.out.println(" Buscando por canal: " + canalPedido);
                    pedidoOpt = pedidoService.buscarPedido(canalPedido, numeroPedido);
                }
            }

            if (pedidoOpt.isPresent()) {
                Pedido pedido = pedidoOpt.get();
                System.out.println(" Pedido encontrado: " + pedido.getNumeroPedido() + " - Estado: " + pedido.getEstado());
                model.addAttribute("pedido", pedido);
            } else {
                System.out.println(" Pedido no encontrado");
                model.addAttribute("error", "No se encontró ningún pedido con el número: " + numeroPedido);
            }

            return "sigue-tu-pedido";

        } catch (Exception e) {
            System.err.println(" Error al buscar pedido: " + e.getMessage());
            model.addAttribute("error", "Error al buscar el pedido: " + e.getMessage());
            return "sigue-tu-pedido";
        }
    }


    @GetMapping("/buscar")
    public String buscarPedidoGet(@RequestParam String numero, Model model) {
        try {
            System.out.println(" Buscando pedido por GET - Número: " + numero);

            Optional<Pedido> pedidoOpt = pedidoService.buscarPorNumeroPedido(numero);

            if (pedidoOpt.isPresent()) {
                Pedido pedido = pedidoOpt.get();
                System.out.println(" Pedido encontrado: " + pedido.getNumeroPedido());
                model.addAttribute("pedido", pedido);
            } else {
                System.out.println(" Pedido no encontrado");
                model.addAttribute("error", "No se encontró ningún pedido con el número: " + numero);
            }

            return "sigue-tu-pedido";

        } catch (Exception e) {
            System.err.println(" Error al buscar pedido: " + e.getMessage());
            model.addAttribute("error", "Error al buscar el pedido: " + e.getMessage());
            return "sigue-tu-pedido";
        }
    }
}
