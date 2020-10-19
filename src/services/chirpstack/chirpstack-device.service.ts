import { BadRequestException, HttpService, Injectable, Logger } from "@nestjs/common";

import { ChirpstackDeviceActivationContentsDto } from "@dto/chirpstack/chirpstack-device-activation-response.dto";
import { ChirpstackDeviceActivationDto } from "@dto/chirpstack/chirpstack-device-activation-response.dto";
import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";
import {
    ChirpstackDeviceKeysContentDto,
    ChirpstackDeviceKeysResponseDto,
} from "@dto/chirpstack/chirpstack-device-keys-response.dto";
import { ChirpstackSingleApplicationResponseDto } from "@dto/chirpstack/chirpstack-single-application-response.dto";
import { ChirpstackSingleDeviceResponseDto } from "@dto/chirpstack/chirpstack-single-device-response.dto";
import { CreateChirpstackApplicationDto } from "@dto/chirpstack/create-chirpstack-application.dto";
import { CreateChirpstackDeviceDto } from "@dto/chirpstack/create-chirpstack-device.dto";
import { ListAllChirpstackApplicationsReponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { ListAllDevicesResponseDto } from "@dto/chirpstack/list-all-devices-response.dto";
import { CreateLoRaWANSettingsDto } from "@dto/create-lorawan-settings.dto";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import {
    CreateChirpstackDeviceQueueItemDto,
    CreateChirpstackDeviceQueueItemResponse,
} from "@dto/chirpstack/create-chirpstack-device-queue-item.dto";
import { DeviceDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-device-downlink-queue-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ChirpstackManyDeviceResponseDto } from "@dto/chirpstack/chirpstack-many-device-response";

@Injectable()
export class ChirpstackDeviceService extends GenericChirpstackConfigurationService {
    constructor(internalHttpService: HttpService) {
        super(internalHttpService);
    }

    private readonly logger = new Logger(ChirpstackDeviceService.name);

    defaultApplicationName = "os2iot";

    DEVICE_NAME_PREFIX = "OS2IOT-";
    DEFAULT_DESCRIPTION = "Created by OS2IoT";

    async findOrCreateDefaultApplication(
        dto: CreateChirpstackDeviceDto
    ): Promise<number> {
        const organizationID = await this.getDefaultOrganizationId();
        // Fetch applications
        const applications = await this.getAllWithPagination<
            ListAllChirpstackApplicationsReponseDto
        >(`applications?limit=100&organizationID=${organizationID}`);
        // if default exist use it
        let applicationId;
        applications.result.forEach(element => {
            if (
                element.serviceProfileID.toLowerCase() ===
                    dto.device.serviceProfileID.toLowerCase() &&
                element.name.startsWith(this.defaultApplicationName)
            ) {
                applicationId = element.id;
            }
        });
        // otherwise create default
        if (!applicationId) {
            applicationId = await this.createDefaultApplication(
                applicationId,
                dto,
                organizationID
            );
        }

        return +applicationId;
    }

    private async createDefaultApplication(
        applicationId: any,
        dto: CreateChirpstackDeviceDto,
        organizationID: string
    ) {
        applicationId = await this.createApplication({
            application: {
                name: `${
                    this.defaultApplicationName
                }-${dto.device.serviceProfileID.toLowerCase()}`.substring(0, 50),
                description: this.DEFAULT_DESCRIPTION,
                organizationID: organizationID,
                serviceProfileID: dto.device.serviceProfileID,
            },
        });
        return applicationId;
    }

    async makeCreateChirpstackDeviceDto(
        dto: CreateLoRaWANSettingsDto,
        name: string
    ): Promise<CreateChirpstackDeviceDto> {
        const csDto = new ChirpstackDeviceContentsDto();
        csDto.name = `${this.DEVICE_NAME_PREFIX}${name}`.toLowerCase();
        csDto.description = this.DEFAULT_DESCRIPTION;
        csDto.devEUI = dto.devEUI;
        csDto.deviceProfileID = dto.deviceProfileID;
        csDto.serviceProfileID = dto.serviceProfileID;

        csDto.isDisabled = dto.isDisabled;
        csDto.skipFCntCheck = dto.skipFCntCheck;

        return { device: csDto };
    }

    async overwriteDownlink(
        dto: CreateChirpstackDeviceQueueItemDto
    ): Promise<CreateChirpstackDeviceQueueItemResponse> {
        await this.deleteDownlinkQueue(dto.deviceQueueItem.devEUI);
        try {
            const res = await this.post<CreateChirpstackDeviceQueueItemDto>(
                `devices/${dto.deviceQueueItem.devEUI}/queue`,
                dto
            );
            return res.data;
        } catch (err) {
            const fcntError =
                "enqueue downlink payload error: get next downlink fcnt for deveui error";
            if (err?.response?.data?.error?.startsWith(fcntError)) {
                throw new BadRequestException(
                    ErrorCodes.DeviceIsNotActivatedInChirpstack
                );
            }

            throw err;
        }
    }

    async getDownlinkQueue(deviceEUI: string): Promise<DeviceDownlinkQueueResponseDto> {
        const res = await this.get<DeviceDownlinkQueueResponseDto>(
            `devices/${deviceEUI}/queue`
        );
        return res;
    }

    async deleteDownlinkQueue(deviceEUI: string): Promise<void> {
        await this.delete(`devices/${deviceEUI}/queue`);
    }

    async activateDeviceWithABP(
        devEUI: string,
        devAddr: string,
        fCntUp: number,
        nFCntDown: number,
        networkSessionKey: string,
        applicationSessionKey: string,
        isUpdate: boolean
    ): Promise<boolean> {
        const { res, dto } = await this.createOrUpdateABPActivation(
            devAddr,
            networkSessionKey,
            applicationSessionKey,
            fCntUp,
            nFCntDown,
            devEUI,
            isUpdate
        );
        if (res.status != 200) {
            this.logger.warn(
                `Could not ABP activate Chirpstack Device using body: ${JSON.stringify(
                    dto
                )}`
            );
            return false;
        }
        return res.status == 200;
    }

    async getAllDevicesStatus(): Promise<ChirpstackManyDeviceResponseDto> {
        return await this.get<ChirpstackManyDeviceResponseDto>(
            `devices?limit=10000&offset=0`
        );
    }

    private async createOrUpdateABPActivation(
        devAddr: string,
        networkSessionKey: string,
        applicationSessionKey: string,
        fCntUp: number,
        nFCntDown: number,
        devEUI: string,
        isUpdate: boolean
    ) {
        const dto = {
            deviceActivation: {
                devAddr: devAddr,
                nwkSEncKey: networkSessionKey,
                appSKey: applicationSessionKey,
                fCntUp: fCntUp,
                nFCntDown: nFCntDown,
                devEUI: devEUI,
                fNwkSIntKey: networkSessionKey,
                sNwkSIntKey: networkSessionKey,
            },
        };
        let res;
        if (isUpdate) {
            res = await this.put(`devices`, dto, `${devEUI}/activate`);
        } else {
            res = await this.post(`devices/${devEUI}/activate`, dto);
        }
        return { res, dto };
    }

    async activateDeviceWithOTAA(
        deviceEUI: string,
        nwkKey: string,
        isUpdate: boolean
    ): Promise<boolean> {
        // http://localhost:8080/api/devices/0011223344557188/keys
        // {"deviceKeys":{"nwkKey":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","devEUI":"0011223344557188"}}

        const dto = {
            deviceKeys: {
                nwkKey: nwkKey,
                devEUI: deviceEUI,
            },
        };
        let res;
        if (isUpdate) {
            res = await this.put(`devices`, dto, `${deviceEUI}/keys`);
        } else {
            res = await this.post(`devices/${deviceEUI}/keys`, dto);
        }
        if (res.status != 200) {
            this.logger.warn(
                `Could not activate Chirpstack Device using body: ${JSON.stringify(dto)}`
            );
            return false;
        }
        return res.status == 200;
    }

    async createOrUpdateDevice(dto: CreateChirpstackDeviceDto): Promise<boolean> {
        let res;
        if (await this.isDeviceAlreadyCreated(dto.device.devEUI)) {
            res = await this.put(`devices`, dto, dto.device.devEUI);
        } else {
            res = await this.post(`devices`, dto);
        }

        if (res.status != 200) {
            this.logger.warn(
                `Could not create Chirpstack Device using body: ${JSON.stringify(dto)}`
            );

            return false;
        }

        return res.status == 200;
    }

    async getChirpstackApplication(
        id: string
    ): Promise<ChirpstackSingleApplicationResponseDto> {
        return await this.get<ChirpstackSingleApplicationResponseDto>(
            `applications/${id}`
        );
    }

    async getChirpstackDevice(id: string): Promise<ChirpstackDeviceContentsDto> {
        const res = await this.get<ChirpstackSingleDeviceResponseDto>(`devices/${id}`);
        res.device.deviceStatusBattery = res.deviceStatusBattery;
        res.device.deviceStatusMargin = res.deviceStatusMargin;
        return res.device;
    }

    async getKeys(deviceId: string): Promise<ChirpstackDeviceKeysContentDto> {
        try {
            const res = await this.get<ChirpstackDeviceKeysResponseDto>(
                `devices/${deviceId}/keys`
            );
            return res.deviceKeys;
        } catch (err) {
            // Chirpstack returns 404 if keys are not saved ..
            return new ChirpstackDeviceKeysContentDto();
        }
    }

    async getActivation(
        deviceId: string
    ): Promise<ChirpstackDeviceActivationContentsDto> {
        const res = await this.get<ChirpstackDeviceActivationDto>(
            `devices/${deviceId}/activation`
        );
        return res.deviceActivation;
    }

    private async isDeviceAlreadyCreated(deviceEUI: string): Promise<boolean> {
        const devices = await this.getAllChirpstackDevices();
        const alreadyExists = devices.some(x => {
            return x.devEUI.toLowerCase() == deviceEUI.toLowerCase();
        });
        return alreadyExists;
    }

    private async getAllChirpstackDevices(): Promise<ChirpstackDeviceContentsDto[]> {
        return (await this.get<ListAllDevicesResponseDto>("devices?limit=1000")).result;
    }

    private async createApplication(
        dto: CreateChirpstackApplicationDto
    ): Promise<string> {
        return (await this.post("applications", dto)).data.id;
    }
}
