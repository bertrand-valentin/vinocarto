package com.bva.backend_services;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories("com.bva.maria_persistence.repository")
@EntityScan("com.bva.maria_persistence.entities")
public class BackendServicesApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendServicesApplication.class, args);
	}

}
