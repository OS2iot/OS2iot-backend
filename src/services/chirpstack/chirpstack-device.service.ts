import { Injectable, HttpService, Logger } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { CreateChirpstackDeviceDto } from "../../entities/dto/chirpstack/create-chirpstack-device.dto";
import { CreateChirpstackApplicationDto } from "@dto/chirpstack/create-chirpstack-application.dto";
import { CreateLoRaWANSettingsDto } from "../../entities/dto/create-lorawan-settings.dto";
import { ChirpstackDeviceContentsDto } from "../../entities/dto/chirpstack/chirpstack-device-contents.dto";
import { ListAllChirpstackApplicationsReponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { ListAllDevicesResponseDto } from "../../entities/dto/chirpstack/list-all-devices-response.dto";

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
            applicationId = await this.createApplication({
                application: {
                    name: `${
                        this.defaultApplicationName
                    }-${dto.device.serviceProfileID.toLowerCase()}`.substring(
                        0,
                        50
                    ),
                    description: this.DEFAULT_DESCRIPTION,
                    organizationID: organizationID,
                    serviceProfileID: dto.device.serviceProfileID,
                },
            });
        }

        return +applicationId;
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

    async activateDeviceWithABP(
        devEUI: string,
        devAddr: string,
        fCntUp: number,
        nFCntDown: number,
        networkSessionKey: string,
        applicationSessionKey: string
    ): Promise<boolean> {
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
        const res = await this.post(`devices/${devEUI}/activate`, dto);
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

    async activateDeviceWithOTAA(
        deviceEUI: string,
        nwkKey: string
    ): Promise<boolean> {
        // http://localhost:8080/api/devices/0011223344557188/keys
        // {"deviceKeys":{"nwkKey":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","devEUI":"0011223344557188"}}

        const dto = {
            deviceKeys: {
                nwkKey: nwkKey,
                devEUI: deviceEUI,
            },
        };
        const res = await this.post(`devices/${deviceEUI}/keys`, dto);
        if (res.status != 200) {
            this.logger.warn(
                `Could not activate Chirpstack Device using body: ${JSON.stringify(
                    dto
                )}`
            );
            return false;
        }
        return res.status == 200;
    }

    async createOrUpdateDevice(
        dto: CreateChirpstackDeviceDto
    ): Promise<boolean> {
        let res;
        if (await this.isDeviceAlreadyCreated(dto.device.devEUI)) {
            res = await this.put(`devices`, dto, dto.device.devEUI);
        } else {
            res = await this.post(`devices`, dto);
        }

        if (res.status != 200) {
            this.logger.warn(
                `Could not create Chirpstack Device using body: ${JSON.stringify(
                    dto
                )}`
            );

            return false;
        }

        return res.status == 200;
    }

    private async isDeviceAlreadyCreated(deviceEUI: string): Promise<boolean> {
        const devices = await this.getAllChirpstackDevices();
        const alreadyExists = devices.some(x => {
            return x.devEUI.toLowerCase() == deviceEUI.toLowerCase();
        });
        return alreadyExists;
    }

    private async getAllChirpstackDevices(): Promise<
        ChirpstackDeviceContentsDto[]
    > {
        return (await this.get<ListAllDevicesResponseDto>("devices?limit=1000"))
            .result;
    }

    private async createApplication(
        dto: CreateChirpstackApplicationDto
    ): Promise<string> {
        return (await this.post("applications", dto)).data.id;
    }
}
