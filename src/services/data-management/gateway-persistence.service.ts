import { ChirpstackMqttConnectionStateMessageDto } from "@dto/chirpstack/chirpstack-mqtt-message.dto";
import { RawGatewayStateDto } from "@dto/kafka/raw-gateway-state.dto";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { subtractDays, subtractHours } from "@helpers/date.helper";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { LessThan, MoreThan, Repository } from "typeorm";

@Injectable()
export class GatewayPersistenceService extends AbstractKafkaConsumer {
  private readonly gatewayStatusSavedDays = 30;
  /**
   * Limit how many messages can be stored for each hour
   */
  private readonly maxStatusMessagesPerHour = 10;

  constructor(
    @InjectRepository(GatewayStatusHistory)
    private gatewayStatusHistoryRepository: Repository<GatewayStatusHistory>
  ) {
    super();
  }

  private readonly logger = new Logger(GatewayPersistenceService.name);

  protected registerTopic(): void {
    this.addTopic(KafkaTopic.RAW_GATEWAY_STATE, "GatewayPersistence");
  }

  // Listen to Kafka event
  @CombinedSubscribeTo(KafkaTopic.RAW_GATEWAY_STATE, "GatewayPersistence")
  async rawRequestListener(payload: KafkaPayload): Promise<void> {
    this.logger.debug(`RAW_GATEWAY_STATE: '${JSON.stringify(payload)}'`);
    const dto = payload.body as RawGatewayStateDto;
    const messageState = dto.rawPayload as unknown as ChirpstackMqttConnectionStateMessageDto;

    const statusHistory = this.mapDtoToEntity(dto, messageState);
    await this.gatewayStatusHistoryRepository.save(statusHistory);

    // Clean up old statuses
    await this.deleteStatusHistoriesSinceLastHour(statusHistory.timestamp, dto.gatewayId);
    await this.deleteOldStatusHistories(dto.gatewayId);
  }

  private mapDtoToEntity(dto: RawGatewayStateDto, messageState: ChirpstackMqttConnectionStateMessageDto) {
    const statusHistory = new GatewayStatusHistory();
    statusHistory.mac = dto.gatewayId;
    statusHistory.timestamp = dto.unixTimestamp ? new Date(dto.unixTimestamp) : new Date();
    statusHistory.wasOnline = !!messageState?.isOnline;
    return statusHistory;
  }

  /**
   * Make sure we never have histories for more than X messages per gateway per hour
   * to avoid filling the database
   * @param latestMessageTime
   * @param gatewayId
   */
  private async deleteStatusHistoriesSinceLastHour(latestMessageTime: Date, gatewayId: string): Promise<void> {
    const lastHour = subtractHours(latestMessageTime);
    // Find the oldest items since the last hour
    const oldestToDelete = await this.gatewayStatusHistoryRepository.find({
      where: { mac: gatewayId, timestamp: MoreThan(lastHour) },
      skip: this.maxStatusMessagesPerHour,
      order: {
        timestamp: "DESC",
      },
    });

    if (oldestToDelete.length === 0) {
      this.logger.debug(
        `Less than ${this.maxStatusMessagesPerHour} gateway status' for gateway ${gatewayId} found in database. Deleting no rows.`
      );
      return;
    }

    const result = await this.gatewayStatusHistoryRepository.delete(oldestToDelete.map(old => old.id));

    this.logger.debug(`Deleted: ${result.affected} rows from gateway_status_history`);
  }

  /**
   * Clean up data if it's older than a specified time period
   * @param deviceId
   */
  private async deleteOldStatusHistories(gatewayId: string): Promise<void> {
    const minDate = subtractDays(new Date(), this.gatewayStatusSavedDays);
    // Find messages older than a date and delete them
    const oldestToDelete = await this.gatewayStatusHistoryRepository.find({
      where: [
        { mac: gatewayId, timestamp: LessThan(minDate) },
        { mac: gatewayId, updatedAt: LessThan(minDate) },
      ],
    });

    if (oldestToDelete.length === 0) {
      this.logger.debug("There's no old gateway status messages");
      return;
    }

    const result = await this.gatewayStatusHistoryRepository.delete(oldestToDelete.map(old => old.id));

    this.logger.debug(`Deleted: ${result.affected} rows from gateway_status_history`);
  }
}
