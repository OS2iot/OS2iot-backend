import { KafkaTopic } from "@enum/kafka-topic.enum";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";

export const KafkaTopicTypeMap = {
    [KafkaTopic.TRANSFORMED_REQUEST]: TransformedPayloadDto,
};
