package com.transmoney.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TransMoney Distributed Digital Wallet API")
                        .version("1.0.0")
                        .description("Distributed Digital Wallet Transaction System with Two-Phase Commit (2PC) Coordination, " +
                                "Deterministic Pessimistic Locking, Sharded PostgreSQL Storage, and Double-Entry Audit Ledger.\n\n" +
                                "### Team Members:\n" +
                                "- **Shehzad Nisar** (B22110006147)\n" +
                                "- **Muhammad Ashraf** (B22110006090)\n" +
                                "- **Daniyal Ahmed** (B21110006024)\n\n" +
                                "### Key Capabilities:\n" +
                                "- **2PC Cross-Shard Transfers**: Atomic cross-shard money movement with zero race conditions.\n" +
                                "- **Deterministic Deadlock Prevention**: Sorted account lock ordering.\n" +
                                "- **Double-Entry Bookkeeping**: Strict debit/credit parity.\n" +
                                "- **Search & Filter**: Trigram & B-tree indexed searching across accounts and transactions.")
                        .contact(new Contact()
                                .name("TransMoney Distributed Database Systems Team")
                                .email("transmoney@project.edu"))
                        .license(new License().name("Educational Use - Distributed Database Systems Course")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development & Evaluation Server")
                ));
    }
}
