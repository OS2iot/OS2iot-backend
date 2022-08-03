import { ComposeAuthGuard } from '@auth/compose-auth.guard';
import {
    Controller,
    Get,
    Logger,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";

import { Read, ApplicationAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { ListAllAdrAlgorithmsResponseDto } from "@dto/chirpstack/list-all-adr-algorithms-response.dto";

@ApiTags("Chirpstack")
@Controller("chirpstack/network-server")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApplicationAdmin()
export class NetworkServerController {
    constructor(private networkServerService: ChirpstackSetupNetworkServerService) {}
    private readonly logger = new Logger(NetworkServerController.name);

    @Get("adr-algorithms")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all ADR algorithms for the default network server" })
    @Read()
    async getAllAdrAlgorithms(): Promise<ListAllAdrAlgorithmsResponseDto> {
        return await this.networkServerService.getAdrAlgorithmsForDefaultNetworkServer();
    }
}
