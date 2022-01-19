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
import { UnauthorizedException } from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllDataTargetsResponseDto } from "@dto/list-all-data-targets-response.dto";
import { ListAllDataTargetsDto } from "@dto/list-all-data-targets.dto";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { DataTarget } from "@entities/data-target.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToApplication,
    checkIfUserHasWriteAccessToApplication,
} from "@helpers/security-helper";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";

@ApiTags("Data Target")
@Controller("data-target")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class DataTargetController {
    constructor(private dataTargetService: DataTargetService) {}

    @Get()
    @ApiOperation({ summary: "Find all DataTargets" })
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllDataTargetsDto
    ): Promise<ListAllDataTargetsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.dataTargetService.findAndCountAllWithPagination(query);
        } else {
            if (query.applicationId) {
                query.applicationId = +query.applicationId;
            }

            const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
            if (+query.applicationId && !allowed.some(x => x === +query.applicationId)) {
                throw new UnauthorizedException();
            }

            return await this.dataTargetService.findAndCountAllWithPagination(
                query,
                allowed
            );
        }
    }

    @Get(":id")
    @ApiOperation({ summary: "Find DataTarget by id" })
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DataTarget> {
        try {
            const dataTarget = await this.dataTargetService.findOne(id);
            checkIfUserHasReadAccessToApplication(req, dataTarget.application.id);
            return dataTarget;
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Post()
    @ApiOperation({ summary: "Create a new DataTargets" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDataTargetDto: CreateDataTargetDto
    ): Promise<DataTarget> {
        try {
            checkIfUserHasWriteAccessToApplication(
                req,
                createDataTargetDto.applicationId
            );
            const dataTarget = await this.dataTargetService.create(
                createDataTargetDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                DataTarget.name,
                req.user.userId,
                dataTarget.id,
                dataTarget.name
            );
            return dataTarget;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, DataTarget.name, req.user.userId);
            throw err;
        }
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing DataTarget" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateDto: UpdateDataTargetDto
    ): Promise<DataTarget> {
        const oldDataTarget = await this.dataTargetService.findOne(id);
        try {
            checkIfUserHasWriteAccessToApplication(req, oldDataTarget.application.id);
            if (oldDataTarget.application.id !== updateDto.applicationId) {
                checkIfUserHasWriteAccessToApplication(req, updateDto.applicationId);
            }
        } catch (err) {
            AuditLog.fail(
                ActionType.UPDATE,
                DataTarget.name,
                req.user.userId,
                oldDataTarget.id,
                oldDataTarget.name
            );
            throw err;
        }

        const dataTarget = await this.dataTargetService.update(
            id,
            updateDto,
            req.user.userId
        );
        AuditLog.success(
            ActionType.UPDATE,
            DataTarget.name,
            req.user.userId,
            dataTarget.id,
            dataTarget.name
        );
        return dataTarget;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing DataTarget" })
    @ApiBadRequestResponse()
    @Write()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const dt = await this.dataTargetService.findOne(id);
            checkIfUserHasWriteAccessToApplication(req, dt.application.id);
            const result = await this.dataTargetService.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(ActionType.DELETE, DataTarget.name, req.user.userId, id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, DataTarget.name, req.user.userId, id);
            if (err?.status === 403) {
                throw err;
            }
            throw new NotFoundException(err);
        }
    }
}
