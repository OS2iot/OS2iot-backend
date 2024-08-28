import { CreateIoTDeviceDownlinkDto } from "@dto/create-iot-device-downlink.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import {
  CreateChirpstackDeviceQueueItemDto,
  CreateChirpstackDeviceQueueItemResponse,
} from "@dto/chirpstack/create-chirpstack-device-queue-item.dto";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { IdResponse } from "@interfaces/chirpstack-id-response.interface";

@Injectable()
export class IoTDeviceDownlinkService {
  constructor(
    private sigfoxApiDeviceTypeService: SigFoxApiDeviceTypeService,
    private sigfoxGroupService: SigFoxGroupService,
    private iotDeviceService: IoTDeviceService,
    private chirpstackDeviceService: ChirpstackDeviceService
  ) {}
  private readonly logger = new Logger(IoTDeviceDownlinkService.name);
  private readonly SIGFOX_DOWNLINK_LENGTH_EXACT = 16;

  async createDownlink(dto: CreateIoTDeviceDownlinkDto, device: IoTDevice): Promise<void | IdResponse> {
    if (device.type === IoTDeviceType.LoRaWAN) {
      const cast = <LoRaWANDevice>device;
      return await this.createLoraDownlink(dto, cast);
    } else if (device.type === IoTDeviceType.SigFox) {
      const cast = <SigFoxDevice>device;
      return await this.createSigfoxDownlink(dto, cast);
    } else {
      throw new BadRequestException(ErrorCodes.DownlinkNotSupportedForDeviceType);
    }
  }

  private async createSigfoxDownlink(dto: CreateIoTDeviceDownlinkDto, cast: SigFoxDevice): Promise<void> {
    this.validateSigfoxPayload(dto);
    this.logger.debug(`Creating downlink for device(${cast.id}) sigfoxId(${cast.deviceId})`);
    cast.downlinkPayload = dto.data;
    await this.iotDeviceService.save(cast);
    await this.updateSigFoxDeviceTypeDownlink(cast);
  }

  private async updateSigFoxDeviceTypeDownlink(cast: SigFoxDevice) {
    const sigfoxGroup = await this.sigfoxGroupService.findOneByGroupId(cast.groupId);
    await this.sigfoxApiDeviceTypeService.addOrUpdateCallback(sigfoxGroup, cast.deviceTypeId);
  }

  private validateSigfoxPayload(dto: CreateIoTDeviceDownlinkDto) {
    if (dto.data.length !== this.SIGFOX_DOWNLINK_LENGTH_EXACT) {
      throw new BadRequestException(ErrorCodes.DownlinkLengthWrongForSigfox);
    }
  }

  private async createLoraDownlink(dto: CreateIoTDeviceDownlinkDto, cast: LoRaWANDevice): Promise<IdResponse> {
    const csDto: CreateChirpstackDeviceQueueItemDto = {
      deviceQueueItem: {
        fPort: dto.port,
        devEUI: cast.deviceEUI,
        confirmed: dto.confirmed,
        data: this.hexBytesToBase64(dto.data),
      },
    };

    try {
      return this.chirpstackDeviceService.overwriteDownlink(csDto);
    } catch (err) {
      this.handleErrorsFromChirpstack(csDto, err);
    }
  }

  private handleErrorsFromChirpstack(csDto: CreateChirpstackDeviceQueueItemDto, err: any) {
    this.logger.error(
      `Error while trying to create downlink i chirpstack. DTO: '${JSON.stringify(csDto)}'. Error: '${JSON.stringify(
        err?.data
      )}'`
    );
    if (err.status == 400) {
      throw new BadRequestException("Error 400 from Chirpstack" + JSON.stringify(err?.data));
    }
    throw new InternalServerErrorException("Could not send to chirpstack, try again later.");
  }

  private hexBytesToBase64(hexBytes: string): string {
    return Buffer.from(hexBytes, "hex").toString("base64");
  }
}
