import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { Injectable, Logger, NotImplementedException } from "@nestjs/common";
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
            this.logger.error(
                `Error finding IoTDevice by id: ${dto.iotDeviceId}. Stopping.`
            );
            return;
        }

        this.logger.debug(
            `Sending payload from deviceId: ${iotDevice.id}; Name: '${iotDevice.name}'`
        );

        await this.findDataTargetsAndSend(iotDevice, dto);
    }

    private async findDataTargetsAndSend(
        iotDevice: IoTDevice,
        dto: TransformedPayloadDto
    ) {
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
                    this.logger.debug(
                        `Sent to HttpPush target: ${JSON.stringify(status)}`
                    );
                } catch (err) {
                    this.logger.error(
                        `Error while sending to Http Push DataTarget: ${err}`
                    );
                }
            } else if (target.type == DataTargetType.Fiware) {
                try {
                    const status = await this.fiwareDataTargetService.send(target, dto);
                    this.logger.debug(`Sent to FIWARE target: ${JSON.stringify(status)}`);
                } catch (err) {
                    this.logger.error(`Error while sending to FIWARE DataTarget: ${err}`);
                }
            } else if (target.type === DataTargetType.MQTT) {
                try {
                    this.mqttDataTargetService.send(target, dto, this.onSendDone);
                } catch (err) {
                    this.logger.error(`Error while sending to MQTT DataTarget: ${err}`);
                }
            } else {
                throw new NotImplementedException(`Not implemented for: ${target.type}`);
            }
        });
    }

    private onSendDone = (status: DataTargetSendStatus, targetType: DataTargetType) => {
        this.logger.debug(`Sent to ${targetType} target: ${JSON.stringify(status)}`);
    };
}
