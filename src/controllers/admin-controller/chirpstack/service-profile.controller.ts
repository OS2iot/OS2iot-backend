import { ComposeAuthGuard } from '@auth/compose-auth.guard';
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

import { Read, ApplicationAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateChirpstackProfileResponseDto } from "@dto/chirpstack/create-chirpstack-profile-response.dto";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ListAllServiceProfilesResponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";

@ApiTags("Chirpstack")
@Controller("chirpstack/service-profiles")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApplicationAdmin()
export class ServiceProfileController {
    constructor(private serviceProfileService: ServiceProfileService) {}
    private readonly logger = new Logger(ServiceProfileController.name);

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new ServiceProfile" })
    @ApiBadRequestResponse()
    @ApplicationAdmin()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateServiceProfileDto
    ): Promise<CreateChirpstackProfileResponseDto> {
        const res = await this.serviceProfileService.createServiceProfile(createDto);
        AuditLog.success(
            ActionType.CREATE,
            "ChirpstackServiceProfile",
            req.user.userId,
            res.data.id,
            createDto.serviceProfile.name
        );
        return res.data;
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update an existing ServiceProfile" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    @ApplicationAdmin()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Body() updateDto: UpdateServiceProfileDto
    ): Promise<void> {
        const result = await this.serviceProfileService.updateServiceProfile(
            updateDto,
            id
        );

        if (result.status != 200) {
            AuditLog.fail(
                ActionType.UPDATE,
                "ChirpstackServiceProfile",
                req.user.userId,
                updateDto.serviceProfile.id,
                updateDto.serviceProfile.name
            );
            throw new InternalServerErrorException(result.data);
        }
        AuditLog.success(
            ActionType.UPDATE,
            "ChirpstackServiceProfile",
            req.user.userId,
            updateDto.serviceProfile.id,
            updateDto.serviceProfile.name
        );
        return;
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find one ServiceProfile by id" })
    @ApiNotFoundResponse()
    @Read()
    async findOne(@Param("id") id: string): Promise<CreateServiceProfileDto> {
        return await this.serviceProfileService.findOneServiceProfileById(id);
    }

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all ServiceProfile" })
    @Read()
    async getAll(
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ): Promise<ListAllServiceProfilesResponseDto> {
        this.logger.debug(`Limit: '${limit}' Offset:'${offset}'`);
        const res = await this.serviceProfileService.findAllServiceProfiles(
            limit || 50,
            offset || 0
        );

        return res;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete one ServiceProfile by id" })
    @ApiNotFoundResponse()
    @ApplicationAdmin()
    async deleteOne(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string
    ): Promise<DeleteResponseDto> {
        try {
            const result = await this.serviceProfileService.deleteServiceProfile(id);
            if (!result) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(
                ActionType.DELETE,
                "ChirpstackServiceProfile",
                req.user.userId,
                id
            );

            return new DeleteResponseDto(1);
        } catch (err) {
            this.logger.error(
                `Error occured during delete: '${JSON.stringify(err?.response?.data)}'`
            );
            if (
                err?.message == "this object is used by other objects, remove them first"
            ) {
                throw new BadRequestException(ErrorCodes.IsUsed);
            }
            AuditLog.fail(
                ActionType.DELETE,
                "ChirpstackServiceProfile",
                req.user.userId,
                id
            );
            throw err;
        }
    }
}
