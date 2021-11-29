import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Req,
    UseGuards,
    Query,
    UnauthorizedException,
    NotFoundException,
    Header,
    ParseIntPipe,
} from "@nestjs/common";
import { MulticastService } from "../../services/device-management/multicast.service";
import { CreateMulticastDto } from "../../entities/dto/create-multicast.dto";
import { UpdateMulticastDto } from "../../entities/dto/update-multicast.dto";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { Multicast } from "@entities/multicast.entity";
import {
    checkIfUserHasReadAccessToApplication,
    checkIfUserHasWriteAccessToApplication,
} from "@helpers/security-helper";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { Read, Write } from "@auth/roles.decorator";
import { ListAllMulticastsDto } from "@dto/list-all-multicasts.dto";
import { ListAllMulticastsResponseDto } from "@dto/list-all-multicasts-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";

@ApiTags("Multicast")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@Controller("multicast")
export class MulticastController {
    constructor(private readonly multicastService: MulticastService) {}

    @Post()
    @ApiOperation({ summary: "Create a new multicast" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createMulticastDto: CreateMulticastDto // the object which is sent from frontend
    ): Promise<Multicast> {
        try {
            checkIfUserHasWriteAccessToApplication(req, createMulticastDto.applicationID); // check for write access. Inspired from datatarget.
            const multicast = await this.multicastService.create(
                createMulticastDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                Multicast.name,
                req.user.userId,
                multicast.lorawanMulticastDefinition.chirpstackGroupId,
                multicast.groupName
            );
            return multicast;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, Multicast.name, req.user.userId);
            throw err;
        }
    }

    @Get()
    @ApiOperation({ summary: "Find all Multicasts" })
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllMulticastsDto
    ): Promise<ListAllMulticastsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.multicastService.findAndCountAllWithPagination(query);
        } else {
            if (query.applicationId) {
                query.applicationId = +query.applicationId;
            }

            const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
            if (+query.applicationId && !allowed.some(x => x === +query.applicationId)) {
                throw new UnauthorizedException();
            }

            return await this.multicastService.findAndCountAllWithPagination(
                query,
                allowed
            );
        }
    }

    @Get(":id")
    @ApiOperation({ summary: "Find Multicast by id" })
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<Multicast> {
        try {
            const multicast = await this.multicastService.findOne(id); // finds multicast from db by id
            checkIfUserHasReadAccessToApplication(req, multicast.application.id);
            return multicast;
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Multicast" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateDto: UpdateMulticastDto
    ): Promise<Multicast> {
        const oldMulticast = await this.multicastService.findOne(id); // get's the existing multicast and checks if user has access to it.
        try {
            checkIfUserHasWriteAccessToApplication(req, oldMulticast.application.id);
            if (oldMulticast.application.id != updateDto.applicationID) {
                checkIfUserHasWriteAccessToApplication(req, updateDto.applicationID);
            }
        } catch (err) {
            AuditLog.fail(
                ActionType.UPDATE,
                Multicast.name,
                req.user.userId,
                oldMulticast.lorawanMulticastDefinition.chirpstackGroupId,
                oldMulticast.groupName
            );
            throw err;
        }

        const multicast = await this.multicastService.update(
            id,
            updateDto,
            req.user.userId
        );
        AuditLog.success(
            ActionType.UPDATE,
            Multicast.name,
            req.user.userId,
            multicast.lorawanMulticastDefinition.chirpstackGroupId,
            multicast.groupName
        );
        return multicast;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing multicast" })
    @ApiBadRequestResponse()
    @Write()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const dt = await this.multicastService.findOne(id);
            checkIfUserHasWriteAccessToApplication(req, dt.application.id);
            const result = await this.multicastService.multicastDelete(id);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(ActionType.DELETE, Multicast.name, req.user.userId, id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, Multicast.name, req.user.userId, id);
            if (err?.status == 403) {
                throw err;
            }
            throw new NotFoundException(err);
        }
    }
}
