import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { FiwareDataTargetService } from "@services/data-targets/fiware-data-target.service";
import { MqttDataTargetService } from "@services/data-targets/mqtt-data-target.service";
import { DataTargetLogService } from "@services/data-targets/data-target-log.service";
import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTargetService } from "@services/data-targets/data-target.service";

@Injectable()
export class DataTargetSenderService {
  private readonly logger = new Logger(DataTargetSenderService.name);

  constructor(
    private httpPushDataTargetService: HttpPushDataTargetService,
    private fiwareDataTargetService: FiwareDataTargetService,
    private mqttDataTargetService: MqttDataTargetService,
    private dataTargetLogService: DataTargetLogService,
    @Inject(forwardRef(() => DataTargetService))
    private dataTargetService: DataTargetService
  ) {}

  public async sendToDataTarget(dataTarget: DataTarget, dto: TransformedPayloadDto) {
    let status;
    if (dataTarget.type == DataTargetType.HttpPush) {
      try {
        status = await this.httpPushDataTargetService.send(dataTarget, dto);
        await this.onSendDone(status, DataTargetType.HttpPush, dataTarget, dto);
      } catch (err) {
        await this.onSendError(err, DataTargetType.HttpPush, dataTarget, dto);
      }
    } else if (dataTarget.type == DataTargetType.Fiware) {
      try {
        status = await this.fiwareDataTargetService.send(dataTarget, dto);
        await this.onSendDone(status, DataTargetType.Fiware, dataTarget, dto);
      } catch (err) {
        await this.onSendError(err, DataTargetType.Fiware, dataTarget, dto);
      }
    } else if (dataTarget.type === DataTargetType.MQTT) {
      try {
        this.mqttDataTargetService.send(dataTarget, dto, this.onSendDone, this.onSendError);
      } catch (err) {
        status = await this.onSendError(err, DataTargetType.MQTT, dataTarget, dto);
      }
    } else if (dataTarget.type === DataTargetType.OpenDataDK) {
      // OpenDataDk data targets are handled uniquely and ignored here.
    } else {
      this.logger.error(`Not implemented for: ${dataTarget.type}`);
    }

    return status;
  }

  public async testMqttDataTarget(dataTarget: DataTarget) {
    return await this.mqttDataTargetService.testConnection(dataTarget);
  }

  private onSendDone = async (
    status: DataTargetSendStatus,
    targetType: DataTargetType,
    datatarget: DataTarget,
    payloadDto: TransformedPayloadDto
  ) => {
    this.logger.debug(`Sent to ${targetType} target: ${JSON.stringify(status)}`);
    await this.dataTargetService.updateLastMessageDate(datatarget.id);
    await this.dataTargetLogService.onSendDone(status, datatarget, payloadDto);
  };

  private onSendError = async (
    err: Error,
    targetType: DataTargetType,
    datatarget: DataTarget,
    payloadDto: TransformedPayloadDto
  ) => {
    this.logger.error(`Error while sending to ${targetType} DataTarget: ${err}`);
    await this.dataTargetService.updateLastMessageDate(datatarget.id);
    await this.dataTargetLogService.onSendError(err, datatarget, payloadDto);
    return err;
  };
}
