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

@Injectable()
export class PayloadTransformerListenerService extends AbstractKafkaConsumer {
    constructor(
        private payloadDecoderService: PayloadDecoderService,
        private ioTDeviceService: IoTDeviceService
    ) {
        super();
    }

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
        Logger.debug(
            `[PayloadTransformerListenerService - #RAW_REQUEST]: '${JSON.stringify(
                payload
            )}'`
        );

        const dto: RawRequestDto = payload.body;
        const relatedIoTDevice = await this.ioTDeviceService.findOne(
            dto.iotDeviceId
        );
        Logger.debug(`IoTDevice: ${JSON.stringify(relatedIoTDevice)}`);
        const payloadDecoder = await this.payloadDecoderService.findOne(1);
        Logger.debug(`PayloadDecoder: ${JSON.stringify(payloadDecoder)}`);
        await this.callUntrustedCode(
            payloadDecoder.decodingFunction,
            relatedIoTDevice,
            dto.rawPayload
        );
    }

    async callUntrustedCode(
        code: string,
        iotDevice: IoTDevice,
        rawPayload: JSON
    ): Promise<void> {
        const vm = new VM({
            timeout: 5000,
            sandbox: {
                innerIotDevice: iotDevice,
                innerPayload: rawPayload,
                test: "1234",
                log(data: any): void {
                    Logger.debug(`Fra VM2: '${data}'`);
                },
                btoa(str: string): string {
                    try {
                        return btoa(str);
                    } catch (err) {
                        return Buffer.from(str).toString("base64");
                    }
                },
                atob(str: string): string {
                    Logger.debug(`called with ${str}`);
                    return Buffer.from(str, 'base64').toString('binary');
                },
            },
        });
        const callingCode = `\n\ndecode(innerPayload, innerIotDevice);`;
        Logger.debug("Calling untrusted code ...");
        const combinedCode = code + callingCode;
        Logger.debug(combinedCode);
        const res = vm.run(new VMScript(combinedCode));
        Logger.log(`Returned: '${JSON.stringify(res)}'`);
        Logger.debug("Done with untrusted code ...");
    }
}
