import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { SigFoxApiDeviceResponse } from "@dto/sigfox/external/sigfox-api-device-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { checkIfUserHasReadAccessToOrganization } from "@helpers/security-helper";
import {
    Controller,
    Get,
    Logger,
    ParseIntPipe,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";

@ApiTags("SigFox")
@Controller("sigfox-api-device")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
export class SigFoxApiDeviceController {
    constructor(
        private service: SigFoxApiDeviceService,
        private usersService: SigfoxApiUsersService,
        private sigfoxGroupService: SigFoxGroupService
    ) {}

    private readonly logger = new Logger(SigFoxApiDeviceController.name);

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all SigFox Devices for a SigFox Group" })
    async getAll(
        @Req() req: AuthenticatedRequest,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiDeviceResponse> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);

        return await this.service.getAllByGroupIds(group, [group.sigfoxGroupId]);
    }
}
