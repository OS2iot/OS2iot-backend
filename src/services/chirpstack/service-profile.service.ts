import { Injectable } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateServiceProfileDto } from "@dto/chirpstack/create-service-profile.dto";
import { ServiceProfileDto } from "@dto/chirpstack/service-profile.dto";
import { ListAllServiceProfilesReponseDto } from "@dto/chirpstack/list-all-service-profiles-response.dto";

import { AxiosResponse } from "axios";

const endpoint = "service-profiles";

@Injectable()
export class ServiceProfileService extends GenericChirpstackConfigurationService {
    public async createServiceProfile(
        data: CreateServiceProfileDto
    ): Promise<AxiosResponse> {
        const result = await this.post(endpoint, data);
        return result;
    }

    public async updateServiceProfile(
        data: CreateServiceProfileDto,
        id: string
    ): Promise<AxiosResponse> {
        return await this.put(endpoint, data, id);
    }
    public async deleteServiceProfile(id: string): Promise<AxiosResponse> {
        return await this.delete(endpoint, id);
    }
    public async findAllServiceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllServiceProfilesReponseDto> {
        const res = await this.getAllWithPagination<
            ListAllServiceProfilesReponseDto
        >(endpoint, limit, offset);

        return res;
    }

    public async findOneServiceProfileById(
        id: string
    ): Promise<CreateServiceProfileDto> {
        const result: CreateServiceProfileDto = await this.getOneById(
            endpoint,
            id
        );
        return result;
    }

    setupServiceProfileData(name: string): CreateServiceProfileDto {
        const serviceProfileDto: ServiceProfileDto = {
            name: name,
            networkServerID: "1",
            organizationID: "1",
            prAllowed: true,
            raAllowed: true,
            reportDevStatusBattery: true,
            reportDevStatusMargin: true,
            ulRatePolicy: "DROP",
        };

        const createServiceProfileDto: CreateServiceProfileDto = {
            serviceProfile: serviceProfileDto,
        };

        return createServiceProfileDto;
    }
}
