package com.distribuidora.system_oficina.employee.service;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.distribuidora.system_oficina.employee.dto.EmployeeRequestDTO;
import com.distribuidora.system_oficina.employee.dto.EmployeeResponseDTO;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.employee.entity.Employee;
import lombok.RequiredArgsConstructor;
import java.util.List;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;

@Service
@RequiredArgsConstructor
public class EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private Employee toEntity(EmployeeRequestDTO dto) {
        Employee entity = new Employee();
        Role role = roleRepository.findByName(dto.getRoleName()).orElseThrow(() -> new RuntimeException("Role not found"));
        entity.setName(dto.getName());
        entity.setCpf(dto.getCpf());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setPassword(passwordEncoder.encode(dto.getPassword()));
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        entity.setRole(role);
        return entity;
    }
    private EmployeeResponseDTO toResponseDTO(Employee entity) {
        return EmployeeResponseDTO.fromEntity(entity);
    }
    public List<EmployeeResponseDTO> listEmployees(){
        return employeeRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public EmployeeResponseDTO getEmployeeById(Integer id){
        return toResponseDTO(employeeRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "employee not found")));
    }
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto){
        Employee employee = toEntity(dto);
        return toResponseDTO(employeeRepository.save(employee));
    }
    public EmployeeResponseDTO updateEmployee(Integer id, EmployeeRequestDTO dto){
        Employee entity = employeeRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "employee not found"));
        Role role = roleRepository.findByName(dto.getRoleName()).orElseThrow(() -> new RuntimeException("Role not found"));
            entity.setName(dto.getName());
            entity.setCpf(dto.getCpf());
            entity.setRole(role);
            entity.setEmail(dto.getEmail());
            entity.setPassword(passwordEncoder.encode(dto.getPassword()));
            entity.setPhone(dto.getPhone());
            entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        
        return toResponseDTO(employeeRepository.save(entity));
    }
    public void deleteEmployee(Integer id){
        if (!employeeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "employee not found");
        }
        employeeRepository.deleteById(id);
    }
}
