import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
    Consumer,
    Kafka,
    KafkaMessage,
    Producer,
    RecordMetadata,
    logLevel,
    KafkaConfig,
} from "kafkajs";

import { SUBSCRIBER_COMBINED_REF_MAP } from "./kafka.decorator";
import { KafkaPayload } from "./kafka.message";

/**
 * Based on: https://github.com/rajeshkumarbehura/ts-nestjs-kafka /
 *           https://dev.to/rajeshkumarbehura/kafkajs-nestjs-with-typescript-simplified-example-35ep
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private readonly consumerSuffix = "-" + Math.floor(Math.random() * 100000);
    private readonly logger = new Logger(KafkaService.name);
    private readonly GROUP_ID = process.env.KAFKA_GROUPID || "os2iot-backend";

    constructor(private kafkaConfig: KafkaConfig) {
        this.kafka = new Kafka({
            ssl: false,
            clientId: this.kafkaConfig.clientId,
            brokers: this.kafkaConfig.brokers,
            logLevel: logLevel.INFO,
            retry: this.kafkaConfig.retry,
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({
            groupId: this.GROUP_ID + this.consumerSuffix,
            heartbeatInterval: 5000,
        });
    }

    async onModuleInit(): Promise<void> {
        await this.connect();
        SUBSCRIBER_COMBINED_REF_MAP.forEach(async (functionRef, topic) => {
            await this.bindAllCombinedTopicToConsumer(topic);
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
        Logger.debug("Disconnecting from Kafka!");
        await this.producer.disconnect();
        await this.consumer.disconnect();
    }

    async bindAllCombinedTopicToConsumer(_topic: string): Promise<void> {
        await this.consumer.subscribe({ topic: _topic, fromBeginning: false });
        await this.consumer.run({
            autoCommit: true,
            autoCommitThreshold: 1,
            eachMessage: async ({
                topic,
                message,
            }: {
                topic: string;
                message: KafkaMessage;
            }) => {
                try {
                    const arr = SUBSCRIBER_COMBINED_REF_MAP.get(topic);
                    this.logger.debug(
                        `Got kafka message, have ${arr.length} receivers ...`
                    );
                    arr.forEach(async tuple => {
                        const object = tuple[0];
                        const fn = tuple[1];
                        this.logger.debug(`Calling method ...`);
                        // bind the subscribed functions to topic
                        const msg = JSON.parse(message.value.toString()) as KafkaPayload;
                        await fn.apply(object, [msg]);
                    });
                } catch (err) {
                    this.logger.error(`Error occurred in eachMessage: ${err}`);
                    this.logger.error(`${JSON.stringify(err)}`);
                }
            },
        });
    }

    async sendMessage(
        kafkaTopic: string,
        kafkaMessage: KafkaPayload
    ): Promise<void | RecordMetadata[]> {
        this.logger.debug(`Connecting producer ...`);
        await this.producer.connect();
        this.logger.debug(`Connected ...`);
        const metadata = await this.producer
            .send({
                topic: kafkaTopic,
                messages: [{ value: JSON.stringify(kafkaMessage) }],
            })
            .catch(e => this.logger.error(e.message, e));
        this.logger.debug(`Sent from producer`);
        await this.producer.disconnect();
        this.logger.debug(`Disconnected ...`);
        return metadata;
    }
}
