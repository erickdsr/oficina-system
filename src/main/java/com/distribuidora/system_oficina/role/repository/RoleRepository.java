package com.distribuidora.system_oficina.role.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.distribuidora.system_oficina.role.entity.Role;
import java.util.Optional;


@Repository 
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(String name);

}
