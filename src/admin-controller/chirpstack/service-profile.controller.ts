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
    ApiProduces,
} from "@nestjs/swagger";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllServiceProfilesReponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";
import { off } from "process";
import { resolve } from "path";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { ChirpstackReponseStatus } from "@dto/chirpstack/chirpstack-response.dto";

@ApiTags("Chirpstack")
@Controller("chirpstack/service-profiles")
export class ServiceProfileController {
    constructor(private serviceProfileService: ServiceProfileService) {}

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new ServiceProfile" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDto: CreateServiceProfileDto
    ): Promise<AxiosResponse> {
        return await this.serviceProfileService.createServiceProfile(createDto);
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update an existing ServiceProfile" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateDto: UpdateServiceProfileDto
    ): Promise<AxiosResponse> {
        const result = await this.serviceProfileService.updateServiceProfile(
            updateDto,
            id
        );
        Logger.log(result);
        return result;
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find one ServiceProfile by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: string): Promise<CreateServiceProfileDto> {
        return await this.serviceProfileService.findOneServiceProfileById(id);
    }

    @Get()
    @ApiProduces("application/json")
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
    async deleteOne(@Param("id") id: string): Promise<AxiosResponse> {
        let result = undefined;
        try {
            result = await this.serviceProfileService.deleteServiceProfile(id);
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
