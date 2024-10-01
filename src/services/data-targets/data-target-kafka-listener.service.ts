import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { Injectable, Logger } from "@nestjs/common";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { DataTargetSenderService } from "@services/data-targets/data-target-sender.service";

const UNIQUE_NAME_FOR_KAFKA = "DataTargetKafka";

@Injectable()
export class DataTargetKafkaListenerService extends AbstractKafkaConsumer {
  private readonly logger = new Logger(DataTargetKafkaListenerService.name);

  constructor(
    private ioTDeviceService: IoTDeviceService,
    private dataTargetService: DataTargetService,
    private dataTargetSenderService: DataTargetSenderService
  ) {
    super();
  }

  @CombinedSubscribeTo(KafkaTopic.TRANSFORMED_REQUEST, UNIQUE_NAME_FOR_KAFKA)
  async transformedRequestListener(payload: KafkaPayload): Promise<void> {
    this.logger.debug(`TRANSFORMED_REQUEST: '${JSON.stringify(payload)}'`);

    const dto = payload.body as TransformedPayloadDto;
    let iotDevice: IoTDevice;
    try {
      iotDevice = await this.ioTDeviceService.findOne(dto.iotDeviceId);
    } catch (err) {
      this.logger.error(`Error finding IoTDevice by id: ${dto.iotDeviceId}. Stopping.`);
      return;
    }

    this.logger.debug(`Sending payload from deviceId: ${iotDevice.id}; Name: '${iotDevice.name}'`);

    await this.findDataTargetsAndSend(iotDevice, dto);
  }

  protected registerTopic(): void {
    this.addTopic(KafkaTopic.TRANSFORMED_REQUEST, UNIQUE_NAME_FOR_KAFKA);
  }

  private async findDataTargetsAndSend(iotDevice: IoTDevice, dto: TransformedPayloadDto) {
    // Get connections in order to only send to the dataTargets which is identified by the pair of IoTDevice and PayloadDecoder
    const dataTargets = await this.dataTargetService.findDataTargetsByConnectionPayloadDecoderAndIoTDevice(
      iotDevice.id,
      dto.payloadDecoderId
    );

    const ids = dataTargets.map(x => x.id).join(", ");
    this.logger.debug(
      `Found ${dataTargets.length} datatargets to send to: [${ids}] for iotDeviceId: '${iotDevice.id}' and payloadDecoderId: '${dto.payloadDecoderId}'`
    );
    this.sendToDataTargets(dataTargets, dto);
  }

  private sendToDataTargets(dataTargets: DataTarget[], dto: TransformedPayloadDto) {
    dataTargets.forEach(async target => {
      await this.dataTargetSenderService.sendToDataTarget(target, dto);
    });
  }
}
