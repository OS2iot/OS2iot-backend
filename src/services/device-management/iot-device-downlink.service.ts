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
import { CreateChirpstackDeviceQueueItemDto } from "@dto/chirpstack/create-chirpstack-device-queue-item.dto";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import {
  ChirpstackMqttAckMessageDto,
  ChirpstackMqttTxAckMessageDto,
} from "@dto/chirpstack/chirpstack-mqtt-message.dto";
import { Downlink } from "@entities/downlink.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { DownlinkQueueDto } from "@dto/downlink.dto";

@Injectable()
export class IoTDeviceDownlinkService {
  constructor(
    @InjectRepository(Downlink)
    private downlinkRepository: Repository<Downlink>,
    private sigfoxApiDeviceTypeService: SigFoxApiDeviceTypeService,
    private sigfoxGroupService: SigFoxGroupService,
    private iotDeviceService: IoTDeviceService,
    private chirpstackDeviceService: ChirpstackDeviceService
  ) {}
  private readonly logger = new Logger(IoTDeviceDownlinkService.name);
  private readonly SIGFOX_DOWNLINK_LENGTH_EXACT = 16;

  async createDownlink(dto: CreateIoTDeviceDownlinkDto, device: IoTDevice): Promise<void> {
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

  async flushDownlinkQueue(device: IoTDevice): Promise<void> {
    try {
      if (device.type === IoTDeviceType.LoRaWAN) {
        const loRaWANDevice = <LoRaWANDevice>device;
        await this.downlinkRepository.update(
          { lorawanDeviceId: loRaWANDevice.id, flushed: false || IsNull() },
          { flushed: true }
        );
        await this.chirpstackDeviceService.deleteDownlinkQueue(loRaWANDevice.deviceEUI);
      } else {
        throw new BadRequestException(ErrorCodes.DownlinkNotSupportedForDeviceType);
      }
    } catch (err) {
      throw err;
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

  private async createLoraDownlink(dto: CreateIoTDeviceDownlinkDto, cast: LoRaWANDevice): Promise<void> {
    const csDto: CreateChirpstackDeviceQueueItemDto = {
      deviceQueueItem: {
        fPort: dto.port,
        devEUI: cast.deviceEUI,
        confirmed: dto.confirmedDownlink,
        data: this.hexBytesToBase64(dto.data),
      },
    };

    try {
      const downlinkQueueId = await this.chirpstackDeviceService.createDownlink(csDto);

      const downlink = new Downlink();
      downlink.queueItemId = downlinkQueueId;
      downlink.payload = csDto.deviceQueueItem.data;
      downlink.port = csDto.deviceQueueItem.fPort;
      downlink.lorawanDevice = cast;

      await this.downlinkRepository.save(downlink);

      return;
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

  public async updateTxAckDownlink(dto: ChirpstackMqttTxAckMessageDto): Promise<void> {
    try {
      const downlink = await this.downlinkRepository.findOne({ where: { queueItemId: dto.queueItemId } });
      if (!downlink) {
        return;
      }

      downlink.sendAt = dto.time;
      downlink.fCntDown = dto.fCntDown;

      await this.downlinkRepository.save(downlink);
    } catch (err) {
      throw err;
    }
  }

  public async updateAckDownlink(dto: ChirpstackMqttAckMessageDto): Promise<void> {
    try {
      const downlink = await this.downlinkRepository.findOne({ where: { queueItemId: dto.queueItemId } });
      if (!downlink) {
        return;
      }

      downlink.acknowledgedAt = dto.time;
      downlink.acknowledged = dto.acknowledged;
      downlink.fCntDown = dto.fCntDown;

      await this.downlinkRepository.save(downlink);
    } catch (err) {
      throw err;
    }
  }

  public async getDownlinkQueue(deviceId: number): Promise<DownlinkQueueDto[]> {
    try {
      const downlinks = await this.downlinkRepository.find({
        where: {
          lorawanDeviceId: deviceId,
          flushed: false || IsNull(),
          sendAt: IsNull(),
          acknowledgedAt: IsNull(),
        },
        order: {
          createdAt: "ASC",
        },
        take: 25,
      });

      return this.mapDownlink(downlinks);
    } catch (err) {
      throw err;
    }
  }

  public async getHistoricalDownlinks(deviceId: number): Promise<DownlinkQueueDto[]> {
    try {
      const downlinks = await this.downlinkRepository.find({
        where: {
          lorawanDeviceId: deviceId,
          sendAt: Not(IsNull()),
        },
        order: {
          createdAt: "DESC",
        },
        take: 25,
      });

      return this.mapDownlink(downlinks);
    } catch (err) {
      throw err;
    }
  }

  private mapDownlink(downlinks: Downlink[]) {
    const downlinksDtos = downlinks.map(d => {
      const buffer = Buffer.from(d.payload, "base64");
      const bufString = buffer.toString("hex");

      const downlinkDto = new DownlinkQueueDto();
      downlinkDto.acknowledged = d.acknowledged;
      downlinkDto.acknowledgedAt = d.acknowledgedAt;
      downlinkDto.createdAt = d.createdAt;
      downlinkDto.fCntDown = d.fCntDown;
      downlinkDto.payload = bufString;
      downlinkDto.port = d.port;
      downlinkDto.sendAt = d.sendAt;
      return downlinkDto;
    });

    return downlinksDtos;
  }
}
