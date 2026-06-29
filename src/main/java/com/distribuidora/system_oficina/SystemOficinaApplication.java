package com.distribuidora.system_oficina;

import java.sql.Timestamp;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.distribuidora.system_oficina.employee.entity.Employee;
import com.distribuidora.system_oficina.employee.repository.EmployeeRepository;
import com.distribuidora.system_oficina.role.entity.Role;
import com.distribuidora.system_oficina.role.repository.RoleRepository;

@SpringBootApplication
public class SystemOficinaApplication {

	public static void main(String[] args) {
		SpringApplication.run(SystemOficinaApplication.class, args);
	}

	@Bean
	@Profile("!test")
	CommandLineRunner createDefaultEmployee(
			EmployeeRepository employeeRepository,
			RoleRepository roleRepository,
			PasswordEncoder passwordEncoder) {
		return args -> {
			Role role = roleRepository.findByName("admin")
					.orElseGet(() -> {
						Role newRole = new Role();
						newRole.setName("admin");
						newRole.setDescription("Administrador do sistema");
						newRole.setCreatedAt(new Timestamp(System.currentTimeMillis()));
						return roleRepository.save(newRole);
					});

			Employee employee = employeeRepository.findByEmail("Email@email.com")
					.orElseGet(Employee::new);
			employee.setName("Usuario Teste");
			employee.setCpf("00000000000");
			employee.setEmail("Email@email.com");
			if (employee.getPassword() == null || !passwordEncoder.matches("123456", employee.getPassword())) {
				employee.setPassword(passwordEncoder.encode("123456"));
			}
			employee.setPhone("11999999999");
			employee.setRole(role);
			employee.setStatus(true);

			employeeRepository.save(employee);
		};
	}

}
