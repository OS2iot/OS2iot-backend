import {
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
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ListAllServiceProfilesReponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";

@ApiTags("Chirpstack")
@Controller("chirpstack/service-profiles")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Write()
export class ServiceProfileController {
    constructor(private serviceProfileService: ServiceProfileService) {}

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new ServiceProfile" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDto: CreateServiceProfileDto
    ): Promise<CreateChirpstackProfileResponseDto> {
        const res = await this.serviceProfileService.createServiceProfile(createDto);
        return res.data;
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update an existing ServiceProfile" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    async update(
        @Param("id") id: string,
        @Body() updateDto: UpdateServiceProfileDto
    ): Promise<void> {
        const result = await this.serviceProfileService.updateServiceProfile(
            updateDto,
            id
        );

        if (result.status != 200) {
            throw new InternalServerErrorException(result.data);
        }

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
    ): Promise<ListAllServiceProfilesReponseDto> {
        Logger.debug(`Limit: '${limit}' Offset:'${offset}'`);
        const res = await this.serviceProfileService.findAllServiceProfiles(
            limit || 50,
            offset || 0
        );

        return res;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete one ServiceProfile by id" })
    @ApiNotFoundResponse()
    async deleteOne(@Param("id") id: string): Promise<DeleteResponseDto> {
        let result = undefined;
        try {
            result = await this.serviceProfileService.deleteServiceProfile(id);
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err?.response?.data)}'`
            );
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        return new DeleteResponseDto(1);
    }
}
