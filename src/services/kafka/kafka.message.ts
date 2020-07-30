import { KafkaBaseDto } from "@dto/kafka/kafka-base.dto";

export class KafkaPayload {
    public body: any;
    public messageId: string;
    public messageType: string;
    public topicName: string;
    public createdTime?: string;

    create?(
        messageId: string,
        body: KafkaBaseDto,
        messageType: string,
        topicName: string
    ): KafkaPayload {
        return {
            messageId,
            body,
            messageType,
            topicName,
            createdTime: new Date().toISOString(),
        };
    }
}

export declare class KafkaConfig {
    clientId: string;
    brokers: string[];
    groupId: string;
}
