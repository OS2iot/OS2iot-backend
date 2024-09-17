import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { DatatargetLog } from "@entities/datatarget-log.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { SendStatus } from "@enum/send-status.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { Injectable, Logger } from "@nestjs/common";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/device-management/iot-device-payload-decoder-data-target-connection.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { FiwareDataTargetService } from "./fiware-data-target.service";
import { MqttDataTargetService } from "./mqtt-data-target.service";

const UNIQUE_NAME_FOR_KAFKA = "DataTargetKafka";

@Injectable()
export class DataTargetKafkaListenerService extends AbstractKafkaConsumer {
  constructor(
    private ioTDeviceService: IoTDeviceService,
    private dataTargetService: DataTargetService,
    private httpPushDataTargetService: HttpPushDataTargetService,
    private fiwareDataTargetService: FiwareDataTargetService,
    private mqttDataTargetService: MqttDataTargetService,
    private ioTDevicePayloadDecoderDataTargetConnectionService: IoTDevicePayloadDecoderDataTargetConnectionService
  ) {
    super();
  }
  private readonly logger = new Logger(DataTargetKafkaListenerService.name);

  protected registerTopic(): void {
    this.addTopic(KafkaTopic.TRANSFORMED_REQUEST, UNIQUE_NAME_FOR_KAFKA);
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
      if (target.type == DataTargetType.HttpPush) {
        try {
          const status = await this.httpPushDataTargetService.send(target, dto);
          this.onSendDone(status, DataTargetType.HttpPush, target, dto);
        } catch (err) {
          this.onSendError(err, DataTargetType.HttpPush, target, dto);
        }
      } else if (target.type == DataTargetType.Fiware) {
        try {
          const status = await this.fiwareDataTargetService.send(target, dto);
          this.onSendDone(status, DataTargetType.Fiware, target, dto);
        } catch (err) {
          this.onSendError(err, DataTargetType.Fiware, target, dto);
        }
      } else if (target.type === DataTargetType.MQTT) {
        try {
          this.mqttDataTargetService.send(target, dto, this.onSendDone);
        } catch (err) {
          this.onSendError(err, DataTargetType.MQTT, target, dto);
        }
      } else if (target.type === DataTargetType.OpenDataDK) {
        // OpenDataDk data targets are handled uniquely and ignored here.
      } else {
        this.logger.error(`Not implemented for: ${target.type}`);
      }
    });
  }

  private onSendDone = (
    status: DataTargetSendStatus,
    targetType: DataTargetType,
    datatarget: DataTarget,
    payloadDto: TransformedPayloadDto
  ) => {
    this.logger.debug(`Sent to ${targetType} target: ${JSON.stringify(status)}`);
    // TODO: Only log here if response-code was error OR this is the first OK after at least one error..
    this.handleDataTargetLogCommon(
      datatarget,
      status?.status,
      status?.statusCode,
      // TODO: Is it even safe to log the actual error-message here? Could it be a GDPR-problem??
      status.errorMessage,
      payloadDto?.iotDeviceId,
      payloadDto?.payloadDecoderId
    );
  };
  private onSendError = (
    err: Error,
    targetType: DataTargetType,
    datatarget: DataTarget,
    payloadDto: TransformedPayloadDto
  ) => {
    this.logger.error(`Error while sending to ${targetType} DataTarget: ${err}`);
    this.handleDataTargetLogCommon(
      datatarget,
      SendStatus.ERROR,
      undefined,
      // TODO: Is it even safe to log the actual error-message here? Could it be a GDPR-problem??
      "" + err,
      payloadDto?.iotDeviceId,
      payloadDto?.payloadDecoderId
    );
  };

  private handleDataTargetLogCommon(
    datatarget: DataTarget,
    status: SendStatus,
    statusCode?: number,
    message?: string,
    iotDeviceId?: number,
    payloadDecoderId?: number
  ) {
    // Ensure no more than 250 events for this target (delete oldest if needed)
    // TODO: Check DB for existing etc...
    // Lookup entity for referenced deviceId
    // TODO: Find by iotDeviceId....
    const iotDevice: IoTDevice = undefined;
    // TODO: Find by payloadDecoderId
    const payloadDecoder: PayloadDecoder = undefined;
    // Insert new event
    const logEntity: DatatargetLog = {
      // Meta-columns should be auto-populated
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      // Actual data
      datatarget,
      type: status.toString(),
      message,
      statusCode,
      iotDevice,
      payloadDecoder,
    };
    // TODO: Insert in DB etc..?
  }
}
