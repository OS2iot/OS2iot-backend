import { ConflictException, Injectable } from "@nestjs/common";
import { AxiosResponse } from "axios";

import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ListAllServiceProfilesResponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";

import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackApplicationResponseDto } from "@dto/chirpstack/chirpstack-application-response.dto";
import { ListAllChirpstackApplicationsResponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";

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
        // If any devices have been made using the service profile then an application was made in chirpstack.
        // We need to remove the application if it exists before deleting the service profile.
        const applications = await this.get<ListAllChirpstackApplicationsResponseDto>(
            `applications?search=${id}&limit=100&offset=0`
        );
        const applicationToDelete = applications.result.find(
            x => x.name.indexOf(id) >= 0
        );
        if (applicationToDelete) {
            // Check if there is any devices on the application
            const deviceOnApplication = await this.get<
                ListAllChirpstackApplicationsResponseDto
            >(`devices?limit=10&applicationID=${applicationToDelete.id}`);
            if (deviceOnApplication.totalCount > 0) {
                throw new ConflictException(ErrorCodes.DeleteNotAllowedHasLoRaWANDevices);
            }

            await this.delete("applications", applicationToDelete.id);
        }

        return await this.delete("service-profiles", id);
    }

    public async findAllServiceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllServiceProfilesResponseDto> {
        const res = await this.getAllWithPagination<ListAllServiceProfilesResponseDto>(
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
