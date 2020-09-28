import { Logger } from "@nestjs/common";
import { Consumer, Kafka, KafkaMessage } from "kafkajs";

import { KafkaTopic } from "@enum/kafka-topic.enum";

export async function waitForEvents(
    kafkaMessages: [string, KafkaMessage][],
    waitFor: number
): Promise<void> {
    const start = new Date().getTime();
    while (kafkaMessages.length < waitFor) {
        await sleep(100);
        if (new Date().getTime() - start > 10000) {
            break;
        }
    }
}

export async function setupKafkaListener(
    consumer: Consumer,
    kafkaMessages: [string, KafkaMessage][],
    topic: KafkaTopic
): Promise<Consumer> {
    const kafka = new Kafka({
        ssl: false,
        clientId: "os2iot-client-e2e",
        brokers: ["host.docker.internal:9093"],
    });
    consumer = kafka.consumer({ groupId: "os2iot-backend-e2e" });
    await consumer.connect();
    await consumer.subscribe({
        topic: topic,
        fromBeginning: false,
    });
    await consumer.run({
        eachMessage: async ({
            topic,
            message,
        }: {
            topic: string;
            message: KafkaMessage;
        }) => {
            Logger.debug(`Got new message in topic: ${topic}`);
            kafkaMessages.push([topic, message]);
        },
    });
    return consumer;
}

export async function sleep(ms: number): Promise<any> {
    await _sleep(ms);
}

export function _sleep(ms: number): any {
    return new Promise(resolve => setTimeout(resolve, ms));
}
