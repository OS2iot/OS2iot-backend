import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ChirpstackPaginatedListDto } from "@dto/chirpstack/chirpstack-paginated-list.dto";
import { ListAllGatewaysReponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllSigFoxGroupReponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
import { SigFoxGetAllRequestDto } from "@dto/sigfox/internal/sigfox-get-all-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { checkIfUserHasReadAccessToOrganization } from "@helpers/security-helper";
import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import {
    ApiProduces,
    ApiOperation,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiTags,
} from "@nestjs/swagger";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";

@ApiTags("SigFox")
@Controller("sigfox-group")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
export class SigfoxGroupController {
    constructor(private service: SigFoxGroupService) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all SigFox Groups" })
    @Read()
    async getAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: SigFoxGetAllRequestDto
    ): Promise<ListAllSigFoxGroupReponseDto> {
        checkIfUserHasReadAccessToOrganization(req, query.organizationId);
        return await this.service.findAll(query.organizationId);
    }
}
