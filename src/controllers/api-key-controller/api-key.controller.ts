import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { OrganizationAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { Controller, UseGuards } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiKeyService } from "@services/api-key-management/api-key.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@OrganizationAdmin()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("API Key Management")
@Controller("api-key")
export class ApiKeyController {
    constructor(private apiKeyService: ApiKeyService) {}
}
