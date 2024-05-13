import { RawIoTDeviceRequestDto } from "@dto/kafka/raw-iot-device-request.dto";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { ListAllConnectionsResponseDto } from "@dto/list-all-connections-response.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { Injectable, Logger } from "@nestjs/common";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/device-management/iot-device-payload-decoder-data-target-connection.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { RecordMetadata } from "kafkajs";
import * as _ from "lodash";
import { KafkaService } from "../kafka/kafka.service";
import { PayloadDecoderExecutorService } from "./payload-decoder-executor.service";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";

@Injectable()
export class PayloadDecoderListenerService extends AbstractKafkaConsumer {
    constructor(
        private connectionService: IoTDevicePayloadDecoderDataTargetConnectionService,
        private chirpstackDeviceService: ChirpstackDeviceService,
        private kafkaService: KafkaService,
        private executor: PayloadDecoderExecutorService
    ) {
        super();
    }

    private readonly logger = new Logger(PayloadDecoderListenerService.name);

    protected registerTopic(): void {
        this.addTopic(KafkaTopic.RAW_REQUEST, PayloadDecoderListenerService.name);
    }

    @CombinedSubscribeTo(KafkaTopic.RAW_REQUEST, PayloadDecoderListenerService.name)
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(`RAW_REQUEST: '${JSON.stringify(payload)}'`);

        // Fetch related objects
        const dto = payload.body as RawIoTDeviceRequestDto;
        const connections = await this.connectionService.findAllByIoTDeviceIdWithDeviceModel(dto.iotDeviceId);
        this.logger.debug(`Found ${connections.count} connections for IoT-Device ${dto.iotDeviceId}`);

        // Find Unique payloadDecoders
        await this.doTransformationsAndSend(connections, dto);
    }

    private async doTransformationsAndSend(connections: ListAllConnectionsResponseDto, dto: RawIoTDeviceRequestDto) {
        const uniqueCombinations = _.uniqBy(connections.data, x => x.payloadDecoder?.id);
        for (const connection of uniqueCombinations) {
            try {
                const iotDevice = connection.iotDevices.find(x => x.id === dto.iotDeviceId);

                await this.decodeAndSendTransformed(connection.payloadDecoder, iotDevice, dto.rawPayload);
            } catch (err) {
                this.logger.error(err);
            }
        }
    }

    private async decodeAndSendTransformed(
        payloadDecoder: PayloadDecoder,
        relatedIoTDevice: IoTDevice,
        rawPayload: JSON
    ) {
        const payloadToSend = await this.decodeIfNeeded(payloadDecoder, relatedIoTDevice, rawPayload);

        // Add transformed request to Kafka
        await this.sendTransformedRequest(relatedIoTDevice, payloadDecoder, payloadToSend);
    }

    private async decodeIfNeeded(payloadDecoder: PayloadDecoder, relatedIoTDevice: IoTDevice, rawPayload: JSON) {
        let res: string;
        if (payloadDecoder != undefined) {
            this.logger.debug(
                `Decoding payload of IoT-Device ${relatedIoTDevice.id} with decoder ${payloadDecoder?.id}`
            );

            let localDevice = relatedIoTDevice;
            // Check if lorawanSettings are read, if they are the iotDevice needs enrichment
            if (
                relatedIoTDevice.type === IoTDeviceType.LoRaWAN &&
                payloadDecoder.decodingFunction.includes("lorawanSettings")
            ) {
                localDevice = await this.chirpstackDeviceService.enrichLoRaWANDevice(relatedIoTDevice);
            }

            // Decode the payload
            res = await this.executor.callUntrustedCode(payloadDecoder.decodingFunction, localDevice, rawPayload);

            this.logger.debug(`Decoded payload to: '${res}'`);
        } else {
            this.logger.debug(`Skip decoding payload ...`);
            res = JSON.stringify(rawPayload);
        }
        return res;
    }

    private async sendTransformedRequest(
        relatedIoTDevice: IoTDevice,
        payloadTransformer: PayloadDecoder,
        decoded: string
    ): Promise<void> {
        const transformedPayloadDto: TransformedPayloadDto = await this.makeTransformedPayload(
            relatedIoTDevice.id,
            payloadTransformer != null ? payloadTransformer.id : null,
            decoded
        );

        const kafkapayload: KafkaPayload = {
            messageId: "transformedRequest" + new Date().valueOf(),
            body: transformedPayloadDto,
            messageType: "transformedRequest.decoded",
            topicName: KafkaTopic.TRANSFORMED_REQUEST,
        };

        const rawStatus = await this.kafkaService.sendMessage(KafkaTopic.TRANSFORMED_REQUEST, kafkapayload);

        if (rawStatus) {
            const metadata = rawStatus as RecordMetadata[];
            this.logger.debug(`kafka status '${metadata[0].errorCode}'`);
        }
    }

    async makeTransformedPayload(
        id: number,
        payloadTransformerId: number,
        decodedPayload: string
    ): Promise<TransformedPayloadDto> {
        return {
            iotDeviceId: id,
            payload: JSON.parse(decodedPayload),
            payloadDecoderId: payloadTransformerId,
        };
    }
}
