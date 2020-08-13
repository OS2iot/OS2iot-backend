import {
    Injectable,
    OnModuleInit,
    Logger,
    BadRequestException,
} from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ListAllServiceProfilesReponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";

import { AxiosResponse } from "axios";
import { UpdateServiceProfileDto } from "@dto/chirpstack/update-service-profile.dto";
import { ChirpstackReponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { ServiceProfileDto } from "@dto/chirpstack/service-profile.dto";

@Injectable()
export class ServiceProfileService extends GenericChirpstackConfigurationService {
    public async createServiceProfile(
        dto: CreateServiceProfileDto
    ): Promise<AxiosResponse> {
        dto = this.updateDto(dto);
        const result = await this.post("service-profiles", dto);
        return result;
    }

    public async updateServiceProfile(
        data: CreateServiceProfileDto,
        id: string
    ): Promise<AxiosResponse> {
        return await this.put("service-profiles", data, id);
    }
    public async deleteServiceProfile(id: string): Promise<AxiosResponse> {
        return await this.delete("service-profiles", id);
    }
    public async findAllServiceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllServiceProfilesReponseDto> {
        const res = await this.getAllWithPagination<
            ListAllServiceProfilesReponseDto
        >("service-profiles", limit, offset);

        return res;
    }

    public async findOneServiceProfileById(
        id: string
    ): Promise<CreateServiceProfileDto> {
        const result: CreateServiceProfileDto = await this.getOneById(
            "service-profiles",
            id
        );
        return result;
    }

    public setupServiceProfileData(name: string): CreateServiceProfileDto {
        const serviceProfileDto: ServiceProfileDto = {
            name: name,
            networkServerID: "1",
            organizationID: "15",
            prAllowed: true,
            raAllowed: true,
            reportDevStatusBattery: true,
            reportDevStatusMargin: true,
            ulRatePolicy: "DROP",
        };

        const serviceProfile: CreateServiceProfileDto = {
            serviceProfile: serviceProfileDto,
        };

        return serviceProfile;
    }
    private updateDto(
        dto: CreateServiceProfileDto | UpdateServiceProfileDto
    ): CreateServiceProfileDto | UpdateServiceProfileDto {
        // Chirpstack requires 'gatewayProfileID' to be set (with value or null)
        if (!dto?.serviceProfile?.id) {
            dto.serviceProfile.id = null;
        }

        return dto;
    }
    private handlePossibleError(
        result: AxiosResponse,
        dto: CreateServiceProfileDto | UpdateServiceProfileDto
    ): ChirpstackReponseStatus {
        if (result.status != 200) {
            Logger.error(
                `Error from Chirpstack: '${JSON.stringify(
                    dto
                )}', got response: ${JSON.stringify(result.data)}`
            );
            throw new BadRequestException({
                success: false,
                error: result.data,
            });
        }

        return { success: true };
    }
}
