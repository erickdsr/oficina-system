package com.distribuidora.system_oficina.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

class JwtServiceTest {

    @Test
    void generateToken_deveIncluirRoleEAuthoritiesCanonicas() {
        JwtService jwtService = new JwtService();
        String secret = "12345678901234567890123456789012";
        ReflectionTestUtils.setField(jwtService, "secret", secret);
        ReflectionTestUtils.setField(jwtService, "expiration", 3_600_000L);

        UserDetails userDetails = User.withUsername("admin@email.com")
                .password("password")
                .authorities("ROLE_ADMIN")
                .build();

        String token = jwtService.generateToken(userDetails);
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody();

        assertEquals("admin@email.com", claims.getSubject());
        assertEquals("ROLE_ADMIN", claims.get("role", String.class));
        assertTrue(claims.get("authorities", List.class).contains("ROLE_ADMIN"));
        assertTrue(claims.getExpiration().after(new java.util.Date()));
        assertTrue(jwtService.isTokenValid(token, userDetails));
    }
}
