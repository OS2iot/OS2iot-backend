import { LoRaWANDeviceId } from "@dto/lorawan-device-id.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

@Injectable()
export class IoTLoRaWANDeviceService {
  constructor(
    @InjectRepository(LoRaWANDevice)
    private iotLorawanDeviceRepository: Repository<LoRaWANDevice>
  ) {}

  private readonly logger = new Logger(IoTLoRaWANDeviceService.name, { timestamp: true });

  public getDeviceEUIsByIds(deviceEUIs: string[]): Promise<LoRaWANDeviceId[]> {
    return this.iotLorawanDeviceRepository.find({
      select: ["deviceEUI"],
      where: { deviceEUI: In(deviceEUIs) },
    });
  }
}
