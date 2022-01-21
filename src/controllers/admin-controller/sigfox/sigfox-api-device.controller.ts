import { ComposeAuthGuard } from './../../../auth/compose-auth.guard';
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { SigFoxApiDeviceResponse } from "@dto/sigfox/external/sigfox-api-device-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { checkIfUserHasReadAccessToOrganization } from "@helpers/security-helper";
import { Controller, Get, ParseIntPipe, Query, Req, UseGuards } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";

@ApiTags("SigFox")
@Controller("sigfox-api-device")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
export class SigFoxApiDeviceController {
    constructor(
        private sigfoxGroupService: SigFoxGroupService,
        private iotDeviceService: IoTDeviceService
    ) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({
        summary:
            "List all SigFox Devices for a SigFox Group, that are not already created in OS2IoT",
    })
    async getAll(
        @Req() req: AuthenticatedRequest,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiDeviceResponse> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);

        return await this.iotDeviceService.getAllSigfoxDevicesByGroup(group, true);
    }
}
