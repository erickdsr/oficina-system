
package com.distribuidora.system_oficina.employee;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.employee.dto.EmployeeRequestDTO;
import com.distribuidora.system_oficina.employee.dto.EmployeeResponseDTO;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.employee.service.EmployeeService;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;

@ExtendWith(MockitoExtension.class)
class EmplyeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    @DisplayName("createEmployee com dados válidos deve criar o employee com a role correta")
    void createEmployee_dadosValidos_deveCriarEmployeeComRoleCorreta() {
        // Arrange
        Role role = new Role();
        role.setName("ADMIN");

        EmployeeRequestDTO request = EmployeeRequestDTO.builder()
                .name("João")
                .cpf("12345678901")
                .email("joao@email.com")
                .password("123456")
                .roleName("ADMIN")
                .phone("11999999999")
                .status(true)
                .build();

        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("123456")).thenReturn("encoded-password");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        EmployeeResponseDTO result = employeeService.createEmployee(request);

        // Assert
        assertThat(result.getRoleName()).isEqualTo("ADMIN");
        assertThat(result.getName()).isEqualTo("João");
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    @DisplayName("createEmployee com role inexistente deve lançar exceção")
    void createEmployee_roleNaoEncontrada_deveLancarExcecao() {
        // Arrange
        EmployeeRequestDTO request = EmployeeRequestDTO.builder()
                .roleName("ADMIN")
                .password("123456")
                .name("João")
                .build();

        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> employeeService.createEmployee(request));
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("getEmployeeById com id inexistente deve lançar exceção")
    void getEmployeeById_idNaoExistente_deveLancarExcecao() {
        // Arrange
        when(employeeRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> employeeService.getEmployeeById(99));
    }

    @Test
    @DisplayName("updateEmployee com dados válidos deve atualizar os campos corretamente")
    void updateEmployee_dadosValidos_deveAtualizarCamposCorretamente() {
        // Arrange
        Employee existing = new Employee();
        existing.setId(1);
        existing.setName("Antigo");
        existing.setCpf("99999999999");
        existing.setEmail("antigo@email.com");
        existing.setPassword("old-password");
        existing.setPhone("11111111111");
        existing.setStatus(true);

        Role role = new Role();
        role.setName("ADMIN");

        EmployeeRequestDTO request = EmployeeRequestDTO.builder()
                .name("Novo")
                .cpf("12345678901")
                .email("novo@email.com")
                .password("123456")
                .roleName("ADMIN")
                .phone("11999999999")
                .status(false)
                .build();

        when(employeeRepository.findById(1)).thenReturn(Optional.of(existing));
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("123456")).thenReturn("encoded-password");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        EmployeeResponseDTO result = employeeService.updateEmployee(1, request);

        // Assert
        assertThat(result.getName()).isEqualTo("Novo");
        assertThat(result.getEmail()).isEqualTo("novo@email.com");
        assertThat(result.getRoleName()).isEqualTo("ADMIN");
        assertThat(result.getStatus()).isFalse();
    }
}
