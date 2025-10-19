package com.sistemaapollo.sistema_apollo.repository;

import com.sistemaapollo.sistema_apollo.model.ProductoFinal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoFinalRepository extends JpaRepository<ProductoFinal, Long> {
}
