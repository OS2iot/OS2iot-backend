import { Injectable, Logger, NotImplementedException } from "@nestjs/common";

import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/device-management/iot-device-payload-decoder-data-target-connection.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";

const UNIQUE_NAME_FOR_KAFKA = "DataTargetKafka";

@Injectable()
export class DataTargetKafkaListenerService extends AbstractKafkaConsumer {
    constructor(
        private ioTDeviceService: IoTDeviceService,
        private dataTargetService: DataTargetService,
        private httpPushDataTargetService: HttpPushDataTargetService,
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

        const dto: TransformedPayloadDto = payload.body;
        let iotDevice;
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
                    await this.sendToHttpPushDataTarget(target, dto);
                } catch (err) {
                    this.logger.error(
                        `Error while sending to Http Push DataTarget: ${err}`
                    );
                }
            } else {
                throw new NotImplementedException(`Not implemented for: ${target.type}`);
            }
        });
    }

    private async sendToHttpPushDataTarget(
        target: DataTarget,
        dto: TransformedPayloadDto
    ) {
        const config = (target as HttpPushDataTarget).toConfiguration();
        const data = {
            rawBody: JSON.stringify(dto.payload),
            mimeType: "application/json",
        };

        const status = await this.httpPushDataTargetService.send(config, data);
        this.logger.debug(`Sent to HttpPush target: ${JSON.stringify(status)}`);
    }
}
