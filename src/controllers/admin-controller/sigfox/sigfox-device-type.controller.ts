import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-type-request.dto";
import {
    SigFoxApiDeviceTypeContent,
    SigFoxApiDeviceTypeResponse,
} from "@dto/sigfox/external/sigfox-api-device-type-response.dto";
import { SigFoxApiIdReferenceDto } from "@dto/sigfox/external/sigfox-api-id-reference.dto";
import { UpdateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/update-sigfox-api-device-type-request.dto";
import { ActionType } from "@entities/audit-log-entry";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import {
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";
import { AuditLog } from "@services/audit-log.service";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";

@ApiTags("SigFox")
@Controller("sigfox-device-type")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
export class SigfoxDeviceTypeController {
    constructor(
        private service: SigFoxApiDeviceTypeService,
        private usersService: SigfoxApiUsersService,
        private sigfoxGroupService: SigFoxGroupService
    ) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all SigFox Device Types for a SigFox Group" })
    async getAll(
        @Req() req: AuthenticatedRequest,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiDeviceTypeResponse> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);
        const sigfoxApiGroup = await this.usersService.getByUserId(group.username, group);

        return await this.service.getAllByGroupIds(group, [sigfoxApiGroup.group.id]);
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List one SigFox Device Type" })
    async getOne(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiDeviceTypeContent> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);

        return await this.service.getById(group, id);
    }

    @Post()
    @Write()
    @ApiCreatedResponse()
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateSigFoxApiDeviceTypeRequestDto,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiIdReferenceDto> {
        try {
            const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
                groupId
            );
            checkIfUserHasWriteAccessToOrganization(req, group.belongsTo.id);
            const res = await this.service.create(group, dto);
            AuditLog.success(
                ActionType.CREATE,
                "SigfoxDeviceType",
                req.user.userId,
                res.id,
                dto.name
            );
            return res;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, "SigfoxDeviceType", req.user.userId);
            throw err;
        }
    }

    @Put(":id")
    @Write()
    @ApiNoContentResponse()
    @ApiBadRequestResponse()
    @HttpCode(204)
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Body() dto: UpdateSigFoxApiDeviceTypeRequestDto,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<void> {
        try {
            const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
                groupId
            );
            checkIfUserHasWriteAccessToOrganization(req, group.belongsTo.id);
            await this.service.update(group, id, dto);
            AuditLog.success(
                ActionType.UPDATE,
                "SigfoxDeviceType",
                req.user.userId,
                id,
                dto.name
            );
        } catch (err) {
            AuditLog.fail(
                ActionType.UPDATE,
                "SigfoxDeviceType",
                req.user.userId,
                id,
                dto.name
            );
            throw err;
        }
    }
}
