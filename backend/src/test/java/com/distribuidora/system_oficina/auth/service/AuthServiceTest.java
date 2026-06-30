package com.distribuidora.system_oficina.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import com.distribuidora.system_oficina.auth.dto.LoginRequestDTO;
import com.distribuidora.system_oficina.auth.dto.LoginResponseDTO;
import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldReturnTokenWhenAuthenticationSucceeds() {
        LoginRequestDTO request = new LoginRequestDTO("funcionario@email.com", "123456");
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                User.withUsername("funcionario@email.com").password("123456").authorities("ROLE_ADMIN").build(),
                null
        );

        Employee employee = new Employee();
        employee.setId(1);
        employee.setName("Funcionário");
        employee.setEmail("funcionario@email.com");
        employee.setPassword("encoded-password");
        Role role = new Role();
        role.setName("ADMIN");
        employee.setRole(role);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");
        when(employeeRepository.findByEmail("funcionario@email.com")).thenReturn(Optional.of(employee));

        LoginResponseDTO response = authService.authenticate(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getType()).isEqualTo("Bearer");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
