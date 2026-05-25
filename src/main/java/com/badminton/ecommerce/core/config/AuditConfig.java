package com.badminton.ecommerce.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing // Kích hoạt tính năng Auditing của Spring Data JPA
public class AuditConfig {
}