package com.sistemaapollo.sistema_apollo.service;

import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import com.sistemaapollo.sistema_apollo.repository.ProductoFinalRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoFinalService {

    private final ProductoFinalRepository productoFinalRepository;

    public ProductoFinalService(ProductoFinalRepository productoFinalRepository) {
        this.productoFinalRepository = productoFinalRepository;
    }

    // Obtener todos los productos
    public List<ProductoFinal> obtenerTodos() {
        return productoFinalRepository.findAll();
    }

    // Obtener producto por ID (con Optional)
    public Optional<ProductoFinal> obtenerPorId(Long id) {
        return productoFinalRepository.findById(id);
    }

    // Guardar producto
    public ProductoFinal guardar(ProductoFinal producto) {
        return productoFinalRepository.save(producto);
    }

    // Eliminar producto
    public void eliminar(Long id) {
        productoFinalRepository.deleteById(id);
    }
    // Actualizar producto existente
    public ProductoFinal actualizar(ProductoFinal producto) {
        if (!productoFinalRepository.existsById(producto.getId())) {
            throw new RuntimeException("El producto con ID " + producto.getId() + " no existe");
        }
        return productoFinalRepository.save(producto);
    }

}
