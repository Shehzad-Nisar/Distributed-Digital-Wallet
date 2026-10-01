package com.transmoney.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScanQrRequest {

    @NotBlank(message = "QR Payload cannot be blank")
    private String qrPayload;
}
