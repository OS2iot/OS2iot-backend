import { Injectable, Logger } from "@nestjs/common";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { IoTDeviceService } from "@services/iot-device.service";
import { PayloadDecoderService } from "./payload-decoder.service";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { VM, VMScript } from "vm2";
import { IoTDevice } from "@entities/iot-device.entity";
import { TransformedPayloadDto } from "../entities/dto/kafka/transformed-payload.dto";
import { KafkaService } from "./kafka/kafka.service";
import { RecordMetadata } from "kafkajs";

@Injectable()
export class PayloadTransformerListenerService extends AbstractKafkaConsumer {
    constructor(
        private payloadDecoderService: PayloadDecoderService,
        private ioTDeviceService: IoTDeviceService,
        private kafkaService: KafkaService
    ) {
        super();
    }

    private readonly logger = new Logger(
        PayloadTransformerListenerService.name
    );

    protected registerTopic(): void {
        this.addTopic(
            KafkaTopic.RAW_REQUEST,
            "PayloadTransformerListenerService"
        );
    }

    @CombinedSubscribeTo(
        KafkaTopic.RAW_REQUEST,
        "PayloadTransformerListenerService"
    )
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(
            `[PayloadTransformerListenerService - #RAW_REQUEST]: '${JSON.stringify(
                payload
            )}'`
        );

        // Fetch related objects
        const dto: RawRequestDto = payload.body;
        const relatedIoTDevice = await this.ioTDeviceService.findOne(
            dto.iotDeviceId
        );
        this.logger.debug(`IoTDevice: ${JSON.stringify(relatedIoTDevice)}`);
        const payloadDecoder = await this.payloadDecoderService.findOne(1);
        this.logger.debug(`PayloadDecoder: ${JSON.stringify(payloadDecoder)}`);

        // Decode the payload
        const decoded = await this.callUntrustedCode(
            payloadDecoder.decodingFunction,
            relatedIoTDevice,
            dto.rawPayload
        );

        this.logger.debug(`Decoded payload to: '${decoded}'`);

        // Add transformed request to Kafka
        await this.sendTransformedRequest(relatedIoTDevice, decoded);
    }

    private async sendTransformedRequest(
        relatedIoTDevice: IoTDevice,
        decoded: string
    ): Promise<void> {
        const transformedPayloadDto: TransformedPayloadDto = await this.makeTransformedPayload(
            relatedIoTDevice.id,
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
        decodedPayload: string
    ): Promise<TransformedPayloadDto> {
        return {
            iotDeviceId: id,
            payload: JSON.parse(decodedPayload),
        };
    }

    async callUntrustedCode(
        code: string,
        iotDevice: IoTDevice,
        rawPayload: JSON
    ): Promise<string> {
        const vm2Logger = new Logger(
            `${PayloadTransformerListenerService.name}-VM2`
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
