package com.distribuidora.system_oficina;

import java.sql.Timestamp;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

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
			PasswordEncoder passwordEncoder,
			Environment environment) {
		return args -> {
			Role role = roleRepository.findByName("admin")
					.orElseGet(() -> {
						Role newRole = new Role();
						newRole.setName("admin");
						newRole.setDescription("Administrador do sistema");
						newRole.setCreatedAt(new Timestamp(System.currentTimeMillis()));
						return roleRepository.save(newRole);
					});

			String adminEmail = environment.getProperty("ADMIN_EMAIL");
			String adminPassword = environment.getProperty("ADMIN_PASSWORD");

			if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
				return;
			}

			Employee employee = employeeRepository.findByEmail(adminEmail)
					.orElseGet(Employee::new);
			employee.setName(environment.getProperty("ADMIN_NAME", "Administrador"));
			employee.setCpf("00000000000");
			employee.setEmail(adminEmail);
			if (employee.getPassword() == null || !passwordEncoder.matches(adminPassword, employee.getPassword())) {
				employee.setPassword(passwordEncoder.encode(adminPassword));
			}
			employee.setPhone(environment.getProperty("ADMIN_PHONE", "11999999999"));
			employee.setRole(role);
			employee.setStatus(true);

			employeeRepository.save(employee);
		};
	}

}
