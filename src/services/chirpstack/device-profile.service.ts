import { Injectable } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ListAllDeviceProfilesReponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";

import { AxiosResponse } from "axios";
import { DeviceProfileDto } from "@dto/chirpstack/device-profile.dto";

@Injectable()
export class DeviceProfileService extends GenericChirpstackConfigurationService {
    public async createDeviceProfile(
        dto: CreateDeviceProfileDto
    ): Promise<AxiosResponse> {
        const result = await this.post("device-profiles", dto);
        return result;
    }

    public async updateDeviceProfile(
        data: CreateDeviceProfileDto,
        id: string
    ): Promise<AxiosResponse> {
        return await this.put("device-profiles", data, id);
    }
    public async deleteDeviceProfile(id: string): Promise<AxiosResponse> {
        return await this.delete("device-profiles", id);
    }
    public async findAllDeviceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllDeviceProfilesReponseDto> {
        const res = await this.getAllWithPagination<
            ListAllDeviceProfilesReponseDto
        >("device-profiles", limit, offset);

        return res;
    }

    public async findOneDeviceProfileById(
        id: string
    ): Promise<CreateDeviceProfileDto> {
        const result: CreateDeviceProfileDto = await this.getOneById(
            "device-profiles",
            id
        );
        return result;
    }

    public setupDeviceProfileData(): CreateDeviceProfileDto {
        const deviceProfileDto: DeviceProfileDto = {
            name: "e2e",
            classBTimeout: 1,
            classCTimeout: 1,
            factoryPresetFreqs: [1],
            geolocBufferTTL: 1,
            geolocMinBufferSize: 1,
            macVersion: "string",
            maxDutyCycle: 1,
            maxEIRP: 1,
            networkServerID: "string",
            organizationID: "string",
            payloadCodec: "string",
            payloadDecoderScript: "string",
            payloadEncoderScript: "string",
            pingSlotDR: 1,
            pingSlotFreq: 1,
            pingSlotPeriod: 1,
            regParamsRevision: "string",
            rfRegion: "string",
            rxDROffset1: 1,
            rxDataRate2: 1,
            rxDelay1: 1,
            rxFreq2: 1,
            supports32BitFCnt: false,
            supportsClassB: false,
            supportsClassC: false,
            supportsJoin: false,
        };

        const deviceProfile: CreateDeviceProfileDto = {
            deviceProfile: deviceProfileDto,
        };

        return deviceProfile;
    }
}
