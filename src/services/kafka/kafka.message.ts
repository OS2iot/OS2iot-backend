export class KafkaPayload {
    public body: unknown;
    public messageId: string;
    public messageType: string;
    public topicName: string;
    public createdTime?: string;

    create?(
        messageId: string,
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        body: any,
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
