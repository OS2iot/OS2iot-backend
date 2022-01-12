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
    Logger,
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
    checkIfUserHasAccessToApplication,
    ApplicationAccessScope,
} from "@helpers/security-helper";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { Read, ApplicationAdmin } from "@auth/roles.decorator";
import { ListAllMulticastsDto } from "@dto/list-all-multicasts.dto";
import { ListAllMulticastsResponseDto } from "@dto/list-all-multicasts-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { MulticastDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-multicast-downlink-queue-response.dto";
import { CreateMulticastDownlinkDto } from "@dto/create-multicast-downlink.dto";
import { CreateChirpstackMulticastQueueItemResponse } from "@dto/chirpstack/create-chirpstack-multicast-queue-item.dto";

@ApiTags("Multicast")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@Controller("multicast")
export class MulticastController {
    constructor(private readonly multicastService: MulticastService) {}
    private readonly logger = new Logger(MulticastController.name);

    @Post()
    @ApiOperation({ summary: "Create a new multicast" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createMulticastDto: CreateMulticastDto
    ): Promise<Multicast> {
        try {
            checkIfUserHasAccessToApplication(
                req,
                createMulticastDto.applicationID,
                ApplicationAccessScope.Write
            );
            const multicast = await this.multicastService.create(
                createMulticastDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                Multicast.name,
                req.user.userId,
                multicast.id,
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
        const applicationId = +query.applicationId;
        if (req.user.permissions.isGlobalAdmin) {
            return await this.multicastService.findAndCountAllWithPagination(query);
        } else {
            if (query.applicationId) {
                query.applicationId = applicationId;
            }

            const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
            if (applicationId && !allowed.some(x => x === applicationId)) {
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
            const multicast = await this.multicastService.findOne(id);
            checkIfUserHasAccessToApplication(
                req,
                multicast.application.id,
                ApplicationAccessScope.Read
            );
            return multicast;
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Get(":id/downlink-multicast")
    @ApiOperation({ summary: "Get downlink queue for multicast" })
    async findMulticastDownlinkQueue(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<MulticastDownlinkQueueResponseDto> {
        let multicast = undefined;
        try {
            multicast = await this.multicastService.findOne(id);
        } catch (err) {
            this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
        }

        if (!multicast) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
        checkIfUserHasAccessToApplication(
            req,
            multicast.application.id,
            ApplicationAccessScope.Read
        );

        return this.multicastService.getDownlinkQueue(
            multicast.lorawanMulticastDefinition.chirpstackGroupId
        );
    }

    @Post(":id/downlink-multicast")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Schedule downlink multicast" })
    @ApiBadRequestResponse()
    async createDownlink(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: CreateMulticastDownlinkDto
    ): Promise<void | CreateChirpstackMulticastQueueItemResponse> {
        try {
            const multicast = await this.multicastService.findOne(id);
            if (!multicast) {
                throw new NotFoundException();
            }
            checkIfUserHasAccessToApplication(
                req,
                multicast.application.id,
                ApplicationAccessScope.Write
            );
            const result = await this.multicastService.createDownlink(dto, multicast);
            AuditLog.success(ActionType.CREATE, "Downlink", req.user.userId);
            return result;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, "Downlink", req.user.userId);
            throw err;
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
        const oldMulticast = await this.multicastService.findOne(id);
        try {
            checkIfUserHasAccessToApplication(
                req,
                oldMulticast.application.id,
                ApplicationAccessScope.Write
            );
            if (oldMulticast.application.id !== updateDto.applicationID) {
                checkIfUserHasAccessToApplication(
                    req,
                    updateDto.applicationID,
                    ApplicationAccessScope.Write
                );
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
            oldMulticast,
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
    @ApplicationAdmin()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const multicast = await this.multicastService.findOne(id);
            checkIfUserHasAccessToApplication(
                req,
                multicast.application.id,
                ApplicationAccessScope.Write
            );
            const result = await this.multicastService.multicastDelete(id, multicast);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(ActionType.DELETE, Multicast.name, req.user.userId, id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, Multicast.name, req.user.userId, id);
            if (err?.status === 403) {
                throw err;
            }
            throw new NotFoundException(err);
        }
    }
}
