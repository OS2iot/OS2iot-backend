import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import {
    ListAllGatewayStatusDto,
    GatewayGetAllStatusResponseDto,
} from "@dto/chirpstack/backend/gateway-all-status.dto";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import { ChirpstackOnlineHistoryService } from "@services/chirpstack/chirpstack-online-history.service";

@ApiTags("Chirpstack backend")
@Controller("chirpstack/backend")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GatewayBackendController {
    constructor(private onlineHistoryService: ChirpstackOnlineHistoryService) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Get the online status of all chirpstack gateways" })
    @Read()
    async getAllStatus(
        @Query() query?: ListAllGatewayStatusDto
    ): Promise<GatewayGetAllStatusResponseDto> {
        return { data: [], count: 0 };
    }
}
