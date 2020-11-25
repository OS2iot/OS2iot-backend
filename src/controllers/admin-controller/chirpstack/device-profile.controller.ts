import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateChirpstackProfileResponseDto } from "@dto/chirpstack/create-chirpstack-profile-response.dto";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ListAllDeviceProfilesResponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";
import { UpdateDeviceProfileDto } from "@dto/chirpstack/update-device-profile.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { checkIfUserHasWriteAccessToOrganization } from "@helpers/security-helper";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";

@ApiTags("Chirpstack")
@Controller("chirpstack/device-profiles")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Write()
export class DeviceProfileController {
    constructor(private deviceProfileService: DeviceProfileService) {}

    private readonly logger = new Logger(DeviceProfileController.name);

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new DeviceProfile" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateDeviceProfileDto
    ): Promise<CreateChirpstackProfileResponseDto> {
        try {
            checkIfUserHasWriteAccessToOrganization(
                req,
                createDto.internalOrganizationId
            );
            const result = await this.deviceProfileService.createDeviceProfile(
                createDto,
                req.user.userId
            );

            AuditLog.success(
                ActionType.CREATE,
                "ChirpstackDeviceProfile",
                req.user.userId,
                createDto.deviceProfile.id,
                createDto.deviceProfile.name
            );

            return result.data;
        } catch (err) {
            AuditLog.fail(
                ActionType.CREATE,
                "ChirpstackDeviceProfile",
                req.user.userId,
                createDto.deviceProfile.id,
                createDto.deviceProfile.name
            );
            throw err;
        }
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update an existing DeviceProfile" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    @Write()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Body() updateDto: UpdateDeviceProfileDto
    ): Promise<void> {
        try {
            await this.deviceProfileService.updateDeviceProfile(updateDto, id, req);
            AuditLog.success(
                ActionType.UPDATE,
                "ChirpstackDeviceProfile",
                req.user.userId,
                updateDto.deviceProfile.id,
                updateDto.deviceProfile.name
            );
        } catch (err) {
            this.logger.error(`Error occured during put: '${JSON.stringify(err)}'`);
            AuditLog.fail(
                ActionType.CREATE,
                "ChirpstackDeviceProfile",
                req.user.userId,
                updateDto.deviceProfile.id,
                updateDto.deviceProfile.name
            );
            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find one DeviceProfile by id" })
    @ApiNotFoundResponse()
    @Read()
    async findOne(@Param("id") id: string): Promise<CreateDeviceProfileDto> {
        let result = undefined;

        try {
            result = await this.deviceProfileService.findOneDeviceProfileById(id);
        } catch (err) {
            this.logger.error(`Error occured during get/:id : '${JSON.stringify(err)}'`);
        }
        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
        return result;
    }

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all DeviceProfile" })
    @Read()
    async getAll(
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ): Promise<ListAllDeviceProfilesResponseDto> {
        let result = undefined;
        try {
            this.logger.debug(`Limit: '${limit}' Offset:'${offset}'`);
            result = await this.deviceProfileService.findAllDeviceProfiles(
                limit || 50,
                offset || 0
            );
        } catch (err) {
            this.logger.error(
                `Error occured during Find all: '${JSON.stringify(err?.response?.data)}'`
            );
        }
        return result;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete one DeviceProfile by id" })
    @ApiNotFoundResponse()
    async deleteOne(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string
    ): Promise<DeleteResponseDto> {
        try {
            let result = undefined;
            try {
                result = await this.deviceProfileService.deleteDeviceProfile(id, req);
            } catch (err) {
                this.logger.error(
                    `Error occured during delete: '${JSON.stringify(
                        err?.response?.data
                    )}'`
                );
                if (
                    err?.message ==
                    "this object is used by other objects, remove them first"
                ) {
                    throw new BadRequestException(ErrorCodes.IsUsed);
                }
            }

            if (!result) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(
                ActionType.DELETE,
                "ChirpstackDeviceProfile",
                req.user.userId,
                id
            );
            return new DeleteResponseDto(1);
        } catch (err) {
            AuditLog.fail(
                ActionType.DELETE,
                "ChirpstackDeviceProfile",
                req.user.userId,
                id
            );
            throw err;
        }
    }
}
