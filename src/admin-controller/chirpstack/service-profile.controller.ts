import {
    Controller,
    Post,
    Header,
    Body,
    Put,
    Param,
    Get,
    Logger,
    NotFoundException,
    Delete,
    Query,
    HttpStatus,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllServiceProfilesReponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { off } from "process";
import { resolve } from "path";

@ApiTags("Chirpstack: Service Profile")
@Controller("chirpstack-service-profile")
export class ServiceProfileController {
    constructor(private serviceProfileService: ServiceProfileService) {}

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new ServiceProfile" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDto: CreateServiceProfileDto
    ): Promise<HttpStatus> {
        try {
            return this.serviceProfileService.createServiceProfile(createDto);
        } catch (e) {}
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing ServiceProfile" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateDto: UpdateServiceProfileDto
    ): Promise<HttpStatus> {
        return this.serviceProfileService.updateServiceProfile(updateDto, id);
    }

    @Get(":id")
    @ApiOperation({ summary: "Find one ServiceProfile by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: string): Promise<CreateServiceProfileDto> {
        return this.serviceProfileService.findOneServiceProfileById(id);
    }

    @Get()
    @ApiOperation({ summary: "Find all ServiceProfile" })
    async getAll(
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ): Promise<ListAllServiceProfilesReponseDto> {
        Logger.debug(`Limit: '${limit}' Offset:'${offset}'`);
        const res = await this.serviceProfileService.findAllServiceProfiles(
            limit,
            offset
        );

        return res;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Find one ServiceProfile by id" })
    @ApiNotFoundResponse()
    async deleteOne(@Param("id") id: string): Promise<DeleteResponseDto> {
        let result = undefined;
        try {
            result = this.serviceProfileService.deleteServiceProfile(id);
        } catch (err) {
            Logger.error(
                `Error occured during findOne: '${JSON.stringify(err)}'`
            );
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        return result;
    }
}
