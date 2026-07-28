package com.distribuidora.system_oficina.employee.service;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import com.distribuidora.system_oficina.employee.dto.EmployeeRequestDTO;
import com.distribuidora.system_oficina.employee.dto.EmployeeResponseDTO;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import com.distribuidora.system_oficina.deletion.DeletionService;
import lombok.RequiredArgsConstructor;
import java.util.List;
import com.distribuidora.system_oficina.role.RoleNameNormalizer;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;

@Service
@RequiredArgsConstructor
public class EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DeletionService deletionService;

    private Employee toEntity(EmployeeRequestDTO dto) {
        Employee entity = new Employee();
        Role role = findRoleByName(dto.getRoleName());
        validatePasswordForCreate(dto.getPassword());
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
    public List<EmployeeResponseDTO> listEmployees(boolean includeInactive) {
        return (includeInactive ? employeeRepository.findAll() : employeeRepository.findByStatus(true)).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public List<EmployeeResponseDTO> listEmployees() {
        return listEmployees(false);
    }
    public EmployeeResponseDTO getEmployeeById(Integer id) {
        return toResponseDTO(employeeRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with id: " + id)));
    }
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto) {
        Employee employee = toEntity(dto);
        return toResponseDTO(employeeRepository.save(employee));
    }
    public EmployeeResponseDTO updateEmployee(Integer id, EmployeeRequestDTO dto) {
        Employee entity = employeeRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with id: " + id));
        Role role = findRoleByName(dto.getRoleName());
        ensureLastActiveAdminIsPreserved(entity, role, dto.getStatus());
        entity.setName(dto.getName());
        entity.setCpf(dto.getCpf());
        entity.setRole(role);
        entity.setEmail(dto.getEmail());
        if (StringUtils.hasText(dto.getPassword())) {
            validatePasswordLength(dto.getPassword());
            entity.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        entity.setPhone(dto.getPhone());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);

        return toResponseDTO(employeeRepository.save(entity));
    }
    public DeletionResultDTO deleteEmployee(Integer id) {
        ensureCanRemoveEmployee(id);
        return deletionService.delete(DeletionResource.EMPLOYEE, id);
    }

    public DeletionResultDTO forceDeleteEmployee(Integer id) {
        ensureCanRemoveEmployee(id);
        return deletionService.forceDelete(DeletionResource.EMPLOYEE, id);
    }

    public DeletionReportDTO getDeletionReport(Integer id) {
        return deletionService.report(DeletionResource.EMPLOYEE, id);
    }

    private Role findRoleByName(String roleName) {
        String normalizedRoleName = RoleNameNormalizer.normalize(roleName);
        return roleRepository.findAll().stream()
                .filter(role -> RoleNameNormalizer.normalize(role.getName()).equals(normalizedRoleName))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Role not found with name: " + roleName));
    }

    private void validatePasswordForCreate(String password) {
        if (!StringUtils.hasText(password)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required to create an employee");
        }
        validatePasswordLength(password);
    }

    private void validatePasswordLength(String password) {
        if (password.length() < 6 || password.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain between 6 and 100 characters");
        }
    }

    private void ensureCanRemoveEmployee(Integer id) {
        Employee employee = employeeRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with id: " + id));
        ensureLastActiveAdminIsPreserved(employee, null, false);
    }

    private void ensureLastActiveAdminIsPreserved(Employee employee, Role nextRole, Boolean nextStatus) {
        Role currentRole = employee.getRole();
        if (currentRole == null || !RoleNameNormalizer.normalize(currentRole.getName()).equals(RoleNameNormalizer.ADMIN)) {
            return;
        }

        boolean willRemainAdmin = nextRole != null
                && RoleNameNormalizer.normalize(nextRole.getName()).equals(RoleNameNormalizer.ADMIN);
        boolean willRemainActive = nextStatus == null || Boolean.TRUE.equals(nextStatus);

        if (willRemainAdmin && willRemainActive) {
            return;
        }

        if (employeeRepository.countByRoleAndStatus(currentRole, true) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ultimo administrador ativo nao pode ser removido ou desativado.");
        }
    }
}
