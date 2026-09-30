package com.transmoney.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountStatusRequest {

    @Schema(description = "Target account status (ACTIVE, FROZEN, CLOSED)", example = "FROZEN")
    @NotBlank(message = "Status cannot be blank")
    @Pattern(regexp = "ACTIVE|FROZEN|CLOSED", message = "Status must be either ACTIVE, FROZEN, or CLOSED")
    private String status;
}
