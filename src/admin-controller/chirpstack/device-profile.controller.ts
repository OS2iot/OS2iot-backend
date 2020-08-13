import {
    ApiTags,
    ApiProduces,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Param,
    Put,
    Delete,
    Logger,
    NotFoundException,
} from "@nestjs/common";

import { ErrorCodes } from "@enum/error-codes.enum";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { UpdateDeviceProfileDto } from "@dto/chirpstack/update-device-profile.dto";
import { ListAllDeviceProfilesReponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";
import { AxiosResponse } from "axios";

@ApiTags("Chirpstack")
@Controller("chirpstack/device-profiles")
export class DeviceProfileController {
    constructor(private deviceProfileService: DeviceProfileService) {}

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new DeviceProfile" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDto: CreateDeviceProfileDto
    ): Promise<AxiosResponse> {
        let result = undefined;
        try {
            result = await this.deviceProfileService
                .createDeviceProfile(createDto)
                .catch();
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err)}'`
            );
        }
        return result;
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update an existing DeviceProfile" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateDto: UpdateDeviceProfileDto
    ): Promise<AxiosResponse> {
        let result = undefined;

        try {
            result = await this.deviceProfileService
                .updateDeviceProfile(updateDto, id)
                .catch();
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err)}'`
            );
        }
        return result;
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find one DeviceProfile by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: string): Promise<CreateDeviceProfileDto> {
        let result = undefined;

        try {
            result = await this.deviceProfileService
                .findOneDeviceProfileById(id)
                .catch();
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err)}'`
            );
        }
        return result;
    }

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all DeviceProfile" })
    async getAll(
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ): Promise<ListAllDeviceProfilesReponseDto> {
        let result = undefined;
        try {
            Logger.debug(`Limit: '${limit}' Offset:'${offset}'`);
            result = await this.deviceProfileService
                .findAllDeviceProfiles(limit, offset)
                .catch();
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err)}'`
            );
        }
        return result;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Deleteq one DeviceProfile by id" })
    @ApiNotFoundResponse()
    async deleteOne(@Param("id") id: string): Promise<AxiosResponse> {
        let result = undefined;
        try {
            result = await this.deviceProfileService.deleteDeviceProfile(id);
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err)}'`
            );
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        return result;
    }
}
