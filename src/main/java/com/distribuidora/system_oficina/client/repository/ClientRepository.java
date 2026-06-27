package com.distribuidora.system_oficina.client.repository;

import com.distribuidora.system_oficina.client.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository <Client, Integer> {

    List<Client> findByName(String name);
    Optional<Client> findByCpfCnpj(String cpfCnpj); 
    List<Client> findByStatus(Boolean status); 
}