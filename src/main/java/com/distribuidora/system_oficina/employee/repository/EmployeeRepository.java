package com.distribuidora.system_oficina.employee.repository;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer>{

    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByCpf(String cpf);
    List<Employee> findByRole(Role role);
    List<Employee> findByStatus(Boolean status);
}
