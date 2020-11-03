import { Injectable } from "@nestjs/common";
import { AxiosResponse } from "axios";

import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ListAllDeviceProfilesResponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";

import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";

@Injectable()
export class DeviceProfileService extends GenericChirpstackConfigurationService {
    public async createDeviceProfile(
        dto: CreateDeviceProfileDto
    ): Promise<AxiosResponse> {
        dto = await this.updateDto(dto);
        const result = await this.post("device-profiles", dto);
        return result;
    }

    public async updateDeviceProfile(
        data: CreateDeviceProfileDto,
        id: string
    ): Promise<AxiosResponse> {
        data = await this.updateDto(data);
        return await this.put("device-profiles", data, id);
    }

    public async deleteDeviceProfile(id: string): Promise<AxiosResponse> {
        return await this.delete("device-profiles", id);
    }

    public async findAllDeviceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllDeviceProfilesResponseDto> {
        const result = await this.getAllWithPagination<ListAllDeviceProfilesResponseDto>(
            "device-profiles",
            limit,
            offset
        );

        return result;
    }

    public async findOneDeviceProfileById(id: string): Promise<CreateDeviceProfileDto> {
        const result: CreateDeviceProfileDto = await this.getOneById(
            "device-profiles",
            id
        );
        return result;
    }

    public async updateDto(dto: CreateDeviceProfileDto): Promise<CreateDeviceProfileDto> {
        dto.deviceProfile.networkServerID = await this.getDefaultNetworkServerId();
        dto.deviceProfile.organizationID = await this.getDefaultOrganizationId();

        return dto;
    }
}
