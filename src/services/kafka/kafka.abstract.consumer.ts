import { OnModuleInit } from "@nestjs/common";

import { SUBSCRIBER_COMBINED_REF_MAP } from "./kafka.decorator";

export abstract class AbstractKafkaConsumer implements OnModuleInit {
    protected abstract registerTopic(): void;

    public async onModuleInit(): Promise<void> {
        this.registerTopic();
    }

    protected addTopic(topicName: string, toReplce: string): void {
        const subs = SUBSCRIBER_COMBINED_REF_MAP.get(topicName);
        // Replace the string part of the tuple with the correct class instance (this)
        subs.forEach(x => {
            if (x[0] == toReplce) {
                x[0] = this;
            }
        });
    }
}
