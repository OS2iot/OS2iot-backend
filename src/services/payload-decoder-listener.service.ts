import { Injectable, Logger } from "@nestjs/common";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { VM, VMScript } from "vm2";
import { IoTDevice } from "@entities/iot-device.entity";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { KafkaService } from "./kafka/kafka.service";
import { RecordMetadata } from "kafkajs";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";

@Injectable()
export class PayloadDecoderListenerService extends AbstractKafkaConsumer {
    constructor(
        private connectionService: IoTDevicePayloadDecoderDataTargetConnectionService,
        private kafkaService: KafkaService
    ) {
        super();
    }

    private readonly logger = new Logger(PayloadDecoderListenerService.name);

    protected registerTopic(): void {
        this.addTopic(
            KafkaTopic.RAW_REQUEST,
            PayloadDecoderListenerService.name
        );
    }

    @CombinedSubscribeTo(
        KafkaTopic.RAW_REQUEST,
        PayloadDecoderListenerService.name
    )
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(`RAW_REQUEST: '${JSON.stringify(payload)}'`);

        // Fetch related objects
        const dto: RawRequestDto = payload.body;
        const connections = await this.connectionService.findAllByIoTDeviceId(
            dto.iotDeviceId
        );
        this.logger.debug(
            `Found ${connections.count} connections for IoT-Device ${dto.iotDeviceId}`
        );

        connections.data.forEach(async connection => {
            try {
                await this.decodeAndSendTransformed(
                    connection.payloadDecoder,
                    connection.iotDevice,
                    dto.rawPayload
                );
            } catch (err) {
                // TODO: Systemlog skal agere her.
                this.logger.error(err);
            }
        });
    }

    private async decodeAndSendTransformed(
        payloadDecoder: PayloadDecoder,
        relatedIoTDevice: IoTDevice,
        rawPayload: JSON
    ) {
        let payloadToSend: string;
        if (payloadDecoder != undefined) {
            this.logger.debug(
                `Decoding payload of IoT-Device ${relatedIoTDevice.id} with decoder ${payloadDecoder?.id}`
            );

            // Decode the payload
            payloadToSend = await this.callUntrustedCode(
                payloadDecoder.decodingFunction,
                relatedIoTDevice,
                rawPayload
            );

            this.logger.debug(`Decoded payload to: '${payloadToSend}'`);
        } else {
            this.logger.debug(`Skip decoding payload ...`);
            payloadToSend = JSON.stringify(rawPayload);
        }

        // Add transformed request to Kafka
        await this.sendTransformedRequest(
            relatedIoTDevice,
            payloadDecoder,
            payloadToSend
        );
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

        const rawStatus = await this.kafkaService.sendMessage(
            KafkaTopic.TRANSFORMED_REQUEST,
            kafkapayload
        );

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

    async callUntrustedCode(
        code: string,
        iotDevice: IoTDevice,
        rawPayload: JSON
    ): Promise<string> {
        const vm2Logger = new Logger(
            `${PayloadDecoderListenerService.name}-VM2`
        );
        const vm = new VM({
            timeout: 5000,
            sandbox: {
                innerIotDevice: iotDevice,
                innerPayload: rawPayload,
                log(data: any): void {
                    vm2Logger.debug(data);
                },
                btoa(str: string): string {
                    return Buffer.from(str).toString("base64");
                },
                atob(str: string): string {
                    return Buffer.from(str, "base64").toString("binary");
                },
            },
        });
        const callingCode = `\n\ndecode(innerPayload, innerIotDevice);`;
        // this.logger.debug("Calling untrusted code ...");
        const combinedCode = code + callingCode;
        // this.logger.debug(combinedCode);
        const res = vm.run(new VMScript(combinedCode));
        this.logger.log(`Returned: '${JSON.stringify(res)}'`);
        // this.logger.debug("Done with untrusted code ...");

        return JSON.stringify(res);
    }
}
