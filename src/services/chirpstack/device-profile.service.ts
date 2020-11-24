import { Injectable } from "@nestjs/common";
import { AxiosResponse } from "axios";

import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ListAllDeviceProfilesResponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";

import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { UpdateDeviceProfileDto } from "@dto/chirpstack/update-device-profile.dto";
import { DeviceProfileDto } from "@dto/chirpstack/device-profile.dto";
import { checkIfUserHasWriteAccessToOrganization } from "@helpers/security-helper";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";

@Injectable()
export class DeviceProfileService extends GenericChirpstackConfigurationService {
    private readonly ORG_ID_KEY = "internalOrganizationId";
    private readonly UPDATED_BY_KEY = "os2iot-updated-by";
    private readonly CREATED_BY_KEY = "os2iot-created-by";

    public async createDeviceProfile(
        dto: CreateDeviceProfileDto,
        userId: number
    ): Promise<AxiosResponse> {
        dto.deviceProfile = await this.updateDto(dto.deviceProfile);
        dto.deviceProfile.tags = this.addOrganizationToTags(dto);
        dto.deviceProfile.tags = this.addUserIdToTags(dto, userId);
        const result = await this.post("device-profiles", dto);
        return result;
    }

    private addOrganizationToTags(
        dto: CreateDeviceProfileDto
    ): { [id: string]: string | number } {
        const tags = dto.deviceProfile?.tags != null ? dto.deviceProfile.tags : {};
        tags[this.ORG_ID_KEY] = `${dto.internalOrganizationId}`;
        return tags;
    }

    private addUserIdToTags(
        dto: CreateDeviceProfileDto,
        userId: number
    ): { [id: string]: string | number } {
        const tags = dto.deviceProfile?.tags != null ? dto.deviceProfile.tags : {};
        tags[this.CREATED_BY_KEY] = `${userId}`;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        return tags;
    }

    public async updateDeviceProfile(
        data: UpdateDeviceProfileDto,
        id: string,
        req: AuthenticatedRequest
    ): Promise<AxiosResponse> {
        data.deviceProfile.tags = await this.updateTags(id, req);
        data.deviceProfile = await this.updateDto(data.deviceProfile);
        return await this.put("device-profiles", data, id);
    }

    private async updateTags(
        deviceProfileId: string,
        req: AuthenticatedRequest
    ): Promise<{ [id: string]: string | number }> {
        const result: CreateDeviceProfileDto = await this.getOneById(
            "device-profiles",
            deviceProfileId
        );
        const tags = result.deviceProfile.tags;
        tags[this.UPDATED_BY_KEY] = `${req.user.userId}`;
        if (tags[this.ORG_ID_KEY] != null) {
            checkIfUserHasWriteAccessToOrganization(req, +tags[this.ORG_ID_KEY]);
        }
        return tags;
    }

    public async deleteDeviceProfile(
        id: string,
        req: AuthenticatedRequest
    ): Promise<AxiosResponse> {
        const result: CreateDeviceProfileDto = await this.getOneById(
            "device-profiles",
            id
        );
        if (result.deviceProfile.tags[this.ORG_ID_KEY] != null) {
            checkIfUserHasWriteAccessToOrganization(
                req,
                +result.deviceProfile.tags[this.ORG_ID_KEY]
            );
        }
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
                x.createdBy = +dp.deviceProfile.createdBy;
                x.updatedBy = +dp.deviceProfile.updatedBy;
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
        result.deviceProfile.createdBy = +result.deviceProfile.tags[this.CREATED_BY_KEY];
        result.deviceProfile.updatedBy = +result.deviceProfile.tags[this.UPDATED_BY_KEY];

        result.deviceProfile.tags[this.ORG_ID_KEY] = undefined;
        result.deviceProfile.tags[this.CREATED_BY_KEY] = undefined;
        result.deviceProfile.tags[this.UPDATED_BY_KEY] = undefined;

        return result;
    }

    public async updateDto(dto: DeviceProfileDto): Promise<DeviceProfileDto> {
        dto.networkServerID = await this.getDefaultNetworkServerId();
        dto.organizationID = await this.getDefaultOrganizationId();

        return dto;
    }
}
