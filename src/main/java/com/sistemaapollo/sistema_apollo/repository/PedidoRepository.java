package com.sistemaapollo.sistema_apollo.repository;

import com.sistemaapollo.sistema_apollo.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByCanalAndNumero(String canal, String numero);

    //  MÉTODO PARA CARGAR PEDIDOS CON ITEMS
    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.items WHERE p.id = :id")
    Optional<Pedido> findByIdWithItems(@Param("id") Long id);

    //  OBTENER TODOS LOS PEDIDOS CON ITEMS
    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.items ORDER BY p.fecha DESC")
    List<Pedido> findAllWithItems();

    //   Obtener pedidos por usuario ordenados por fecha
    @Query("SELECT p FROM Pedido p WHERE p.usuario.id = :usuarioId ORDER BY p.fecha DESC")
    List<Pedido> findByUsuarioIdOrderByFechaDesc(@Param("usuarioId") Long usuarioId);

    //   Buscar pedido por número
    @Query("SELECT p FROM Pedido p WHERE p.numero = :numero")
    Optional<Pedido> findByNumero(@Param("numero") String numero);

    //   Obtener pedidos por estado
    @Query("SELECT p FROM Pedido p WHERE p.estado = :estado ORDER BY p.fecha DESC")
    List<Pedido> findByEstadoOrderByFechaDesc(@Param("estado") String estado);




    List<Pedido> findAllByOrderByFechaDesc();

    Optional<Pedido> findByNumeroPedido(String numeroPedido);
}
