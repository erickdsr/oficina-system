package com.distribuidora.system_oficina.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.distribuidora.system_oficina.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldReturnTokenWhenAuthenticationSucceeds() {
        LoginRequestDTO request = new LoginRequestDTO("funcionario@email.com", "123456");
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                User.withUsername("funcionario@email.com").password("123456").authorities("ROLE_ADMIN").build(),
                null
        );

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        LoginResponseDTO response = authService.authenticate(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getType()).isEqualTo("Bearer");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
