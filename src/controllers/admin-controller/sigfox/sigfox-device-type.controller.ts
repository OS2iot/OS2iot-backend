import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { ApplicationAdmin, Read } from "@auth/roles.decorator";
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
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import {
    ApiBadRequestResponse,
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
import { ApiAuth } from "@auth/swagger-auth-decorator";

@ApiTags("SigFox")
@Controller("sigfox-device-type")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
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
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(groupId);
        checkIfUserHasAccessToOrganization(req, group.belongsTo.id, OrganizationAccessScope.ApplicationRead);
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
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(groupId);
        checkIfUserHasAccessToOrganization(req, group.belongsTo.id, OrganizationAccessScope.ApplicationRead);

        return await this.service.getById(group, id);
    }

    @Post()
    @ApplicationAdmin()
    @ApiCreatedResponse()
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateSigFoxApiDeviceTypeRequestDto,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiIdReferenceDto> {
        try {
            const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(groupId);
            checkIfUserHasAccessToOrganization(req, group.belongsTo.id, OrganizationAccessScope.ApplicationWrite);
            const res = await this.service.create(group, dto);
            AuditLog.success(ActionType.CREATE, "SigfoxDeviceType", req.user.userId, res.id, dto.name);
            return res;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, "SigfoxDeviceType", req.user.userId);
            throw err;
        }
    }

    @Put(":id")
    @ApplicationAdmin()
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
            const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(groupId);
            checkIfUserHasAccessToOrganization(req, group.belongsTo.id, OrganizationAccessScope.ApplicationWrite);
            await this.service.update(group, id, dto);
            AuditLog.success(ActionType.UPDATE, "SigfoxDeviceType", req.user.userId, id, dto.name);
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, "SigfoxDeviceType", req.user.userId, id, dto.name);
            throw err;
        }
    }
}
