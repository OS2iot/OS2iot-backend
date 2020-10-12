import { CreateIoTDeviceDownlinkDto } from "@dto/create-iot-device-downlink.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";

@Injectable()
export class IoTDeviceDownlinkService {
    constructor(
        private sigfoxApiDeviceTypeService: SigFoxApiDeviceTypeService,
        private sigfoxGroupService: SigFoxGroupService,
        private iotDeviceService: IoTDeviceService
    ) {}
    private readonly logger = new Logger(IoTDeviceDownlinkService.name);
    private readonly SIGFOX_DOWNLINK_LENGTH_EXACT = 16;

    async createDownlink(
        dto: CreateIoTDeviceDownlinkDto,
        device: IoTDevice
    ): Promise<void> {
        if (device.type == IoTDeviceType.LoRaWAN) {
            const cast = <LoRaWANDevice>device;
            return await this.createLoraDownlink(dto, cast);
        } else if (device.type == IoTDeviceType.SigFox) {
            const cast = <SigFoxDevice>device;
            return await this.createSigfoxDownlink(dto, cast);
        } else {
            throw new BadRequestException(ErrorCodes.DownlinkNotSupportedForDeviceType);
        }
    }

    private async createSigfoxDownlink(
        dto: CreateIoTDeviceDownlinkDto,
        cast: SigFoxDevice
    ): Promise<void> {
        this.validateSigfoxPayload(dto);
        this.logger.debug(
            `Creating downlink for device(${cast.id}) sigfoxId(${cast.deviceId})`
        );
        cast.downlinkPayload = dto.data;
        await this.iotDeviceService.save(cast);
        await this.updateSigFoxDeviceTypeDownlink(cast);
    }

    private async updateSigFoxDeviceTypeDownlink(cast: SigFoxDevice) {
        const sigfoxGroup = await this.sigfoxGroupService.findOneByGroupId(cast.groupId);
        await this.sigfoxApiDeviceTypeService.addOrUpdateCallback(
            sigfoxGroup,
            cast.deviceTypeId
        );
    }

    private validateSigfoxPayload(dto: CreateIoTDeviceDownlinkDto) {
        if (dto.data.length !== this.SIGFOX_DOWNLINK_LENGTH_EXACT) {
            throw new BadRequestException(ErrorCodes.DownlinkLengthWrongForSigfox);
        }
    }

    private async createLoraDownlink(
        dto: CreateIoTDeviceDownlinkDto,
        cast: LoRaWANDevice
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
