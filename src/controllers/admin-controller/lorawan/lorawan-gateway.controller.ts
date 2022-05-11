import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import {
    GatewayGetAllStatusResponseDto,
    ListAllGatewayStatusDto,
} from "@dto/chirpstack/backend/gateway-all-status.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import {
    checkIfUserHasAccessToOrganization,
    OrganizationAccessScope,
} from "@helpers/security-helper";
import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import { GatewayStatusHistoryService } from "@services/chirpstack/gateway-status-history.service";

@ApiTags("LoRaWAN gateway")
@Controller("lorawan/gateway")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoRaWANGatewayController {
    constructor(private onlineHistoryService: GatewayStatusHistoryService) {}

    @Get("/status")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Get the status for all LoRaWAN gateways" })
    @Read()
    async getAllStatus(
        @Req() req: AuthenticatedRequest,
        @Query() query: ListAllGatewayStatusDto
    ): Promise<GatewayGetAllStatusResponseDto> {
        if (query.organizationId) {
            checkIfUserHasAccessToOrganization(
                req,
                query.organizationId,
                OrganizationAccessScope.ApplicationRead
            );
        }

        return this.onlineHistoryService.findAllWithChirpstack(query);
    }
}
