import { Injectable } from "@nestjs/common";
import { AxiosResponse } from "axios";

import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ListAllDeviceProfilesResponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";

import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { UpdateDeviceProfileDto } from "@dto/chirpstack/update-device-profile.dto";
import { DeviceProfileDto } from "@dto/chirpstack/device-profile.dto";

@Injectable()
export class DeviceProfileService extends GenericChirpstackConfigurationService {
    private readonly ORG_ID_KEY = "internalOrganizationId";

    public async createDeviceProfile(
        dto: CreateDeviceProfileDto
    ): Promise<AxiosResponse> {
        dto.deviceProfile = await this.updateDto(dto.deviceProfile);
        dto.deviceProfile.tags = this.addOrganizationToTags(dto);
        const result = await this.post("device-profiles", dto);
        return result;
    }

    private addOrganizationToTags(
        dto: CreateDeviceProfileDto
    ): { [id: string]: string | number } {
        let tags = dto.deviceProfile?.tags != null ? dto.deviceProfile.tags : {};
        tags[this.ORG_ID_KEY] = `${dto.internalOrganizationId}`;
        return tags;
    }

    public async updateDeviceProfile(
        data: UpdateDeviceProfileDto,
        id: string
    ): Promise<AxiosResponse> {
        data.deviceProfile = await this.updateDto(data.deviceProfile);
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

        await Promise.all(
            result.result.map(async x => {
                const dp = await this.findOneDeviceProfileById(x.id);
                x.internalOrganizationId = +dp.deviceProfile.internalOrganizationId;
            })
        );

        return result;
    }

    public async findOneDeviceProfileById(id: string): Promise<CreateDeviceProfileDto> {
        const result: CreateDeviceProfileDto = await this.getOneById(
            "device-profiles",
            id
        );
        result.deviceProfile.internalOrganizationId = +result.deviceProfile.tags[
            this.ORG_ID_KEY
        ];
        result.deviceProfile.tags[this.ORG_ID_KEY] = undefined;

        return result;
    }

    public async updateDto(dto: DeviceProfileDto): Promise<DeviceProfileDto> {
        dto.networkServerID = await this.getDefaultNetworkServerId();
        dto.organizationID = await this.getDefaultOrganizationId();

        return dto;
    }
}
