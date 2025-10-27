package com.sistemaapollo.sistema_apollo.service;

import com.sistemaapollo.sistema_apollo.model.Pedido;
import com.sistemaapollo.sistema_apollo.model.ItemPedido;
import com.sistemaapollo.sistema_apollo.model.CarritoItem;
import com.sistemaapollo.sistema_apollo.model.Usuario;
import com.sistemaapollo.sistema_apollo.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;

    public PedidoService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    public Optional<Pedido> buscarPedido(String canal, String numero) {
        return pedidoRepository.findByCanalAndNumero(canal, numero);
    }

    public List<Pedido> obtenerTodosLosPedidos() {
        return pedidoRepository.findAllWithItems();
    }

    //  CREAR NUEVO PEDIDO
    @Transactional
    public Pedido crearPedido(Usuario usuario, List<CarritoItem> carrito, Map<String, Object> datosPedido) {
        try {
            // Crear nuevo pedido
            Pedido pedido = new Pedido();
            pedido.setUsuario(usuario);
            pedido.setEstado("PENDIENTE");
            pedido.setMetodoPago((String) datosPedido.get("metodoPago"));
            pedido.setTipoEntrega((String) datosPedido.get("tipoEntrega"));
            pedido.setDireccionEntrega((String) datosPedido.get("direccion"));
            pedido.setInstrucciones((String) datosPedido.get("instrucciones"));
            pedido.setObservaciones((String) datosPedido.get("observaciones"));


            for (CarritoItem carritoItem : carrito) {
                ItemPedido itemPedido = new ItemPedido();
                itemPedido.setNombreProducto(carritoItem.getProducto().getNombre());
                itemPedido.setCantidad(carritoItem.getCantidad());
                itemPedido.setPrecio(carritoItem.getPrecioUnitario());
                itemPedido.setSubtotal(carritoItem.getPrecioUnitario() * carritoItem.getCantidad());
                pedido.agregarItem(itemPedido);
            }


            pedido.calcularTotales();


            Pedido pedidoGuardado = pedidoRepository.save(pedido);


            String numeroGenerado = "LR" + String.format("%06d", pedidoGuardado.getId());
            pedidoGuardado.setNumero(numeroGenerado);
            pedidoGuardado.setNumeroPedido(numeroGenerado);
            pedidoGuardado.setCanal("WEB");


            return pedidoRepository.save(pedidoGuardado);

        } catch (Exception e) {
            throw new RuntimeException("Error al crear el pedido: " + e.getMessage(), e);
        }
    }


    public Optional<Pedido> obtenerPedidoPorId(Long pedidoId) {
        return pedidoRepository.findById(pedidoId);
    }

    //  OBTENER PEDIDOS POR USUARIO
    public List<Pedido> obtenerPedidosPorUsuario(Long usuarioId) {
        return pedidoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }


    @Transactional
    public Pedido actualizarEstadoPedido(Long pedidoId, String nuevoEstado) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(pedidoId);
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            pedido.setEstado(nuevoEstado);
            return pedidoRepository.save(pedido);
        } else {
            throw new RuntimeException("Pedido no encontrado");
        }
    }

    public Optional<Pedido> buscarPorNumeroPedido(String numeroPedido) {
        return pedidoRepository.findByNumeroPedido(numeroPedido);
    }
}
