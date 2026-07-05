package com.distribuidora.system_oficina.auth;

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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import com.distribuidora.system_oficina.auth.dto.LoginRequestDTO;
import com.distribuidora.system_oficina.auth.dto.LoginResponseDTO;
import com.distribuidora.system_oficina.auth.service.AuthService;
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
    @DisplayName("authenticate com credenciais corretas deve retornar um token")
    void authenticate_credenciaisCorretas_deveRetornarToken() {
        // Arrange
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

        // Act
        LoginResponseDTO response = authService.authenticate(request);

        // Assert
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getType()).isEqualTo("Bearer");
        assertThat(response.getName()).isEqualTo("Funcionário");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("authenticate com email inexistente deve lançar exceção")
    void authenticate_emailNaoExistente_deveLancarExcecao() {
        // Arrange
        LoginRequestDTO request = new LoginRequestDTO("inexistente@email.com", "123456");
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                User.withUsername("inexistente@email.com").password("123456").authorities("ROLE_ADMIN").build(),
                null
        );

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");
        when(employeeRepository.findByEmail("inexistente@email.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> authService.authenticate(request));
        verify(employeeRepository).findByEmail("inexistente@email.com");
    }

    @Test
    @DisplayName("authenticate com senha errada deve lançar exceção")
    void authenticate_senhaErrada_deveLancarExcecao() {
        // Arrange
        LoginRequestDTO request = new LoginRequestDTO("funcionario@email.com", "senha-errada");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.authenticate(request));
        verify(employeeRepository, never()).findByEmail(any());
    }
}
