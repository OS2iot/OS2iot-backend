import { SigFoxCallbackDto } from "@dto/sigfox/sigfox-callback.dto";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { Injectable } from "@nestjs/common";
import { KafkaService } from "@services/kafka/kafka.service";
import { RawRequestDto } from "../../entities/dto/kafka/raw-request.dto";
import { KafkaPayload } from "../kafka/kafka.message";

@Injectable()
export class SigFoxListenerService {
    constructor() {}

    async sendToKafka(
        iotDevice: SigFoxDevice,
        data: SigFoxCallbackDto
    ): Promise<void> {
        const dto = new RawRequestDto();
        dto.iotDeviceId = iotDevice.id;
        dto.rawPayload = JSON.parse(JSON.stringify(data));
        dto.unixTimestamp = data.time;

        const payload: KafkaPayload = {
            messageId: "sigFox" + new Date().valueOf(),
            body: dto,
            messageType: "receiveData.sigFox",
            topicName: KafkaTopic.RAW_REQUEST,
        };

        const rawStatus = await this.sendToKafka;
    }
}
