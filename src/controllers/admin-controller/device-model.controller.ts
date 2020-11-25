import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateDeviceModelDto } from "@dto/create-device-model.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllDeviceModelResponseDto } from "@dto/list-all-device-model-response.dto";
import { UpdateDeviceModelDto } from "@dto/update-device-model.dto";
import { ActionType } from "@entities/audit-log-entry";
import { DeviceModel } from "@entities/device-model.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    NotFoundException,
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
    ApiForbiddenResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuditLog } from "@services/audit-log.service";
import { DeviceModelService } from "@services/device-management/device-model.service";

@ApiTags("Device Model")
@Controller("device-model")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class DeviceModelController {
    constructor(private service: DeviceModelService) {}

    @Get()
    @ApiOperation({ summary: "Get all device models" })
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query("organizationId", new ParseIntPipe()) organizationId: number
    ): Promise<ListAllDeviceModelResponseDto> {
        if (organizationId != null) {
            checkIfUserHasReadAccessToOrganization(req, organizationId);
            return this.service.getAllDeviceModelsByOrgIds([organizationId]);
        }

        const orgIds = req.user.permissions.getAllOrganizationsWithAtLeastRead();
        return this.service.getAllDeviceModelsByOrgIds(orgIds);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get one device model" })
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeviceModel> {
        const deviceModel = await this.service.getById(id);
        if (!deviceModel) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        checkIfUserHasReadAccessToOrganization(req, deviceModel.belongsTo.id);
        return deviceModel;
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new device model" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateDeviceModelDto
    ): Promise<DeviceModel> {
        checkIfUserHasWriteAccessToOrganization(req, dto.belongsToId);

        const res = await this.service.create(dto, req.user.userId);
        AuditLog.success(ActionType.CREATE, DeviceModel.name, req.user.userId, res.id);
        return res;
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update a device model" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: UpdateDeviceModelDto
    ): Promise<DeviceModel> {
        const deviceModel = await this.service.getByIdWithRelations(id);
        try {
            checkIfUserHasWriteAccessToOrganization(req, deviceModel.belongsTo.id);
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, DeviceModel.name, req.user.userId, id);
            throw err;
        }
        const res = await this.service.update(deviceModel, dto, req.user.userId);
        AuditLog.success(ActionType.UPDATE, DeviceModel.name, req.user.userId, id);
        return res;
    }

    @Delete(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Delete a device model" })
    @ApiBadRequestResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        const deviceModel = await this.service.getByIdWithRelations(id);
        try {
            checkIfUserHasWriteAccessToOrganization(req, deviceModel.belongsTo.id);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, DeviceModel.name, req.user.userId, id);
            throw err;
        }
        const res = await this.service.delete(id);
        AuditLog.success(ActionType.DELETE, DeviceModel.name, req.user.userId, id);
        return new DeleteResponseDto(res.affected);
    }
}
