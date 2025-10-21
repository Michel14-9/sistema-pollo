package com.sistemaapollo.sistema_apollo.service;

import com.sistemaapollo.sistema_apollo.model.Local;
import com.sistemaapollo.sistema_apollo.repository.LocalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocalService {

    private final LocalRepository localRepository;

    public LocalService(LocalRepository localRepository) {
        this.localRepository = localRepository;
    }

    public List<Local> obtenerTodosLosLocales() {
        return localRepository.findAll();
    }

    public Local obtenerLocalPorId(Long id) {
        return localRepository.findById(id).orElse(null);
    }
}
