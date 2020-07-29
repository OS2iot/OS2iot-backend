import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
    Logger,
} from "@nestjs/common";
import { Consumer, Kafka, Producer, RecordMetadata } from "kafkajs";
import {
    SUBSCRIBER_FIXED_FN_REF_MAP,
    SUBSCRIBER_FN_REF_MAP,
    SUBSCRIBER_OBJ_REF_MAP,
} from "./kafka.decorator";
import { KafkaConfig, KafkaPayload } from "./kafka.message";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private fixedConsumer: Consumer;
    private readonly consumerSuffix = "-" + Math.floor(Math.random() * 100000);

    constructor(private kafkaConfig: KafkaConfig) {
        this.kafka = new Kafka({
            clientId: this.kafkaConfig.clientId,
            brokers: this.kafkaConfig.brokers,
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({
            groupId: this.kafkaConfig.groupId + this.consumerSuffix,
        });
        this.fixedConsumer = this.kafka.consumer({
            groupId: this.kafkaConfig.groupId,
        });
    }

    async onModuleInit(): Promise<void> {
        await this.connect();
        SUBSCRIBER_FN_REF_MAP.forEach((functionRef, topic) => {
            this.bindAllTopicToConsumer(topic);
        });

        SUBSCRIBER_FIXED_FN_REF_MAP.forEach((functionRef, topic) => {
            this.bindAllTopicToFixedConsumer(topic);
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }

    async connect(): Promise<void> {
        await this.producer.connect();
        await this.consumer.connect();
        await this.fixedConsumer.connect();
    }

    async disconnect(): Promise<void> {
        await this.producer.disconnect();
        await this.consumer.disconnect();
        await this.fixedConsumer.disconnect();
    }

    async bindAllTopicToConsumer(_topic: string): Promise<void> {
        await this.consumer.subscribe({ topic: _topic, fromBeginning: false });
        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                const functionRef = SUBSCRIBER_FN_REF_MAP.get(topic);
                const object = SUBSCRIBER_OBJ_REF_MAP.get(topic);
                functionRef.forEach(async fn => {
                    // bind the subscribed functions to topic
                    const msg = JSON.parse(
                        message.value.toString()
                    ) as KafkaPayload;
                    await fn.apply(object, [msg]);
                });
            },
        });
    }

    async bindAllTopicToFixedConsumer(_topic: string): Promise<void> {
        await this.fixedConsumer.subscribe({
            topic: _topic,
            fromBeginning: false,
        });
        await this.fixedConsumer.run({
            eachMessage: async ({ topic, message }) => {
                const functionRef = SUBSCRIBER_FIXED_FN_REF_MAP.get(topic);
                const object = SUBSCRIBER_OBJ_REF_MAP.get(topic);
                functionRef.forEach(async fn => {
                    // bind the subscribed functions to topic
                    await fn.apply(object, [message.value.toString()]);
                });
            },
        });
    }

    async sendMessage(
        kafkaTopic: string,
        kafkaMessage: KafkaPayload
    ): Promise<void | RecordMetadata[]> {
        await this.producer.connect();
        const metadata = await this.producer
            .send({
                topic: kafkaTopic,
                messages: [{ value: JSON.stringify(kafkaMessage) }],
            })
            .catch(e => Logger.error(e.message, e));
        await this.producer.disconnect();
        return metadata;
    }
}
