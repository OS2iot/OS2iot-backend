import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import {
    GatewayGetAllStatusResponseDto,
    ListAllGatewayStatusDto,
} from "@dto/chirpstack/backend/gateway-all-status.dto";
import { GatewayStatus, GetGatewayStatusQuery } from "@dto/chirpstack/backend/gateway-status.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { GatewayStatusHistoryService } from "@services/chirpstack/gateway-status-history.service";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";

@ApiTags("LoRaWAN gateway")
@Controller("lorawan/gateway")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoRaWANGatewayController {
    constructor(
        private onlineHistoryService: GatewayStatusHistoryService,
        private chirpstackGatewayService: ChirpstackGatewayService
    ) {}

    @Get("/status")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Get the status for all LoRaWAN gateways" })
    @Read()
    async getAllStatus(
        @Req() req: AuthenticatedRequest,
        @Query() query: ListAllGatewayStatusDto
    ): Promise<GatewayGetAllStatusResponseDto> {
        // Currently, everyone is allowed to get the status
        return this.onlineHistoryService.findAllWithChirpstack(query);
    }

    @Get("/status/:id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Get the status for a LoRaWAN gateway" })
    async getStatus(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Query() query: GetGatewayStatusQuery
    ): Promise<GatewayStatus> {
        // Currently, everyone is allowed to get the status
        const gatewayDto = await this.chirpstackGatewayService.getOne(id);
        return this.onlineHistoryService.findOne(gatewayDto.gateway, query.timeInterval);
    }
}
