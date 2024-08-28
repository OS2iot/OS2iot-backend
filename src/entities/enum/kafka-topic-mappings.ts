import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { KafkaTopic } from "@enum/kafka-topic.enum";

export const KafkaTopicTypeMap = {
  [KafkaTopic.TRANSFORMED_REQUEST]: TransformedPayloadDto,
};
