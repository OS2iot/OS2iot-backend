import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiSecurity } from "@nestjs/swagger";

export function ApiAuth() {
    return applyDecorators(ApiBearerAuth(), ApiSecurity("X-API-KEY"));
}
