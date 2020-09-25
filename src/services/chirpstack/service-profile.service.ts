import { Injectable } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ListAllServiceProfilesReponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";

import { AxiosResponse } from "axios";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";

@Injectable()
export class ServiceProfileService extends GenericChirpstackConfigurationService {
    public async createServiceProfile(
        dto: CreateServiceProfileDto
    ): Promise<AxiosResponse> {
        dto = await this.updateDto(dto);
        const result = await this.post("service-profiles", dto);
        return result;
    }

    public async updateServiceProfile(
        data: CreateServiceProfileDto,
        id: string
    ): Promise<AxiosResponse> {
        data = await this.updateDto(data);
        return await this.put("service-profiles", data, id);
    }

    public async deleteServiceProfile(id: string): Promise<AxiosResponse> {
        return await this.delete("service-profiles", id);
    }

    public async findAllServiceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllServiceProfilesReponseDto> {
        const res = await this.getAllWithPagination<ListAllServiceProfilesReponseDto>(
            "service-profiles",
            limit,
            offset
        );

        return res;
    }

    public async findOneServiceProfileById(id: string): Promise<CreateServiceProfileDto> {
        const result: CreateServiceProfileDto = await this.getOneById(
            "service-profiles",
            id
        );
        return result;
    }

    private async updateDto(
        dto: CreateServiceProfileDto | UpdateServiceProfileDto
    ): Promise<Promise<CreateServiceProfileDto | UpdateServiceProfileDto>> {
        // Chirpstack requires 'gatewayProfileID' to be set (with value or null)
        if (!dto?.serviceProfile?.id) {
            dto.serviceProfile.id = null;
        }

        dto.serviceProfile.networkServerID = await this.getDefaultNetworkServerId();
        dto.serviceProfile.organizationID = await this.getDefaultOrganizationId();

        return dto;
    }
}
