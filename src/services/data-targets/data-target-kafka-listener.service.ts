import { Injectable, Logger, NotImplementedException } from "@nestjs/common";
import { SubscribeToFixedGroup } from "@services/kafka/kafka.decorator";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { plainToClass } from "class-transformer";
import { IoTDeviceService } from "@services/iot-device.service";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetType } from "@enum/data-target-type.enum";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { DataTarget } from "@entities/data-target.entity";

@Injectable()
export class DataTargetKafkaListenerService extends AbstractKafkaConsumer {
    constructor(
        private ioTDeviceService: IoTDeviceService,
        private dataTargetService: DataTargetService,
        private httpPushDataTargetService: HttpPushDataTargetService
    ) {
        super();
    }
    protected registerTopic(): void {
        this.addTopic(KafkaTopic.TRANSFORMED_REQUEST);
    }

    @SubscribeToFixedGroup(KafkaTopic.TRANSFORMED_REQUEST)
    async transformedRequestListener(payload: KafkaPayload): Promise<void> {
        Logger.debug(
            `[DataTargetKafkaListener - #TRANSFORMED_REQUEST]: '${JSON.stringify(
                payload
            )}'`
        );

        const dto = this.kafkaPayloadtoDto(payload);

        let iotDevice = null;
        try {
            iotDevice = await this.ioTDeviceService.findOne(dto.iotDeviceId);
        } catch (err) {
            Logger.error(
                `Could not find device with id: ${dto.iotDeviceId}. [Error: ${err}]`
            );
            return;
        }

        Logger.debug(
            `Sending payload from deviceId: ${iotDevice.id}; Name: '${iotDevice.name}'`
        );

        const dataTargets = await this.dataTargetService.findDataTargetsByApplicationId(
            iotDevice.application.id
        );
        Logger.debug(
            `Found ${dataTargets.length} DataTargets: [${dataTargets
                .map(x => x.id)
                .join(", ")}]`
        );

        await this.sendToDataTargets(dataTargets, dto);
    }

    private sendToDataTargets(
        dataTargets: DataTarget[],
        dto: TransformedPayloadDto
    ) {
        dataTargets.forEach(async target => {
            if (target.type == DataTargetType.HttpPush) {
                try {
                    await this.sendToHttpPushDataTarget(target, dto);
                } catch (err) {
                    Logger.error(
                        `Error while sending to Http Push DataTarget: ${err}`
                    );
                }
            } else {
                throw new NotImplementedException(
                    `Not implemented for: ${target.type}`
                );
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
        Logger.debug(`Sent to HttpPush target: ${JSON.stringify(status)}`);
    }

    private kafkaPayloadtoDto(payload: KafkaPayload): TransformedPayloadDto {
        const decodedPayload = (plainToClass<TransformedPayloadDto, JSON>(
            TransformedPayloadDto,
            payload.body
        ) as unknown) as TransformedPayloadDto;

        Logger.debug(`payload: ${JSON.stringify(decodedPayload.payload)}`);
        return decodedPayload;
    }
}
