import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
    Logger,
} from "@nestjs/common";
import {
    Consumer,
    Kafka,
    Producer,
    RecordMetadata,
    KafkaMessage,
} from "kafkajs";
import { KafkaConfig, KafkaPayload } from "./kafka.message";
import { SUBSCRIBER_COMBINED_REF_MAP } from "./kafka.decorator";

/**
 * Based on: https://github.com/rajeshkumarbehura/ts-nestjs-kafka /
 *           https://dev.to/rajeshkumarbehura/kafkajs-nestjs-with-typescript-simplified-example-35ep
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private fixedConsumer: Consumer;
    private readonly consumerSuffix = "-" + Math.floor(Math.random() * 100000);

    constructor(private kafkaConfig: KafkaConfig) {
        this.kafka = new Kafka({
            ssl: false,
            clientId: this.kafkaConfig.clientId,
            brokers: this.kafkaConfig.brokers,
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({
            groupId: this.kafkaConfig.groupId + this.consumerSuffix,
        });
    }

    async onModuleInit(): Promise<void> {
        await this.connect();
        SUBSCRIBER_COMBINED_REF_MAP.forEach((functionRef, topic) => {
            this.bindAllCombinedTopicToConsumer(topic);
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }

    async connect(): Promise<void> {
        await this.producer.connect();
        await this.consumer.connect();
    }

    async disconnect(): Promise<void> {
        await this.producer.disconnect();
        await this.consumer.disconnect();
    }

    async bindAllCombinedTopicToConsumer(_topic: string): Promise<void> {
        await this.consumer.subscribe({ topic: _topic, fromBeginning: false });
        await this.consumer.run({
            eachMessage: async ({
                topic,
                message,
            }: {
                topic: string;
                message: KafkaMessage;
            }) => {
                const arr = SUBSCRIBER_COMBINED_REF_MAP.get(topic);
                arr.forEach(async tuple => {
                    const object = tuple[0];
                    const fn = tuple[1];
                    // bind the subscribed functions to topic
                    const msg = JSON.parse(
                        message.value.toString()
                    ) as KafkaPayload;
                    await fn.apply(object, [msg]);
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
