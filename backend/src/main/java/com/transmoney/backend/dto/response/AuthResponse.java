package com.transmoney.backend.dto.response;

import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    @Schema(description = "Cryptographically signed JWT Bearer Token")
    private String token;

    @Schema(description = "Token format identifier", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Authenticated user profile")
    private User user;

    @Schema(description = "List of accounts owned by the user")
    private List<Account> accounts;
}
