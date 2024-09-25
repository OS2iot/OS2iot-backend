import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { DatatargetLog } from "@entities/datatarget-log.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { SendStatus } from "@enum/send-status.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { In, MoreThan, Repository } from "typeorm";

@Injectable()
export class DataTargetLogService {
  private datatargetLogMaxEvents: number;

  constructor(
    configService: ConfigService,
    @InjectRepository(DatatargetLog)
    private datatargetLogRepository: Repository<DatatargetLog>
  ) {
    this.datatargetLogMaxEvents = configService.get<number>("backend.datatargetLogMaxEvents");
  }

  public onSendDone = async (
    status: DataTargetSendStatus,
    datatarget: DataTarget,
    payloadDto: TransformedPayloadDto
  ) => {
    // If this is just an OK-event, we only want to log it if the latest event before it was an error, for this datatarget. Otherwise early return
    if (status.status === SendStatus.OK) {
      const datatargetLastestEvent = await this.datatargetLogRepository.findOne({
        where: { datatarget: { id: datatarget.id } },
        order: { createdAt: "DESC" },
      });
      if (datatargetLastestEvent?.type !== SendStatus.ERROR) return;
    }

    await this.handleDataTargetLogCommon(
      datatarget,
      status?.status,
      status?.statusCode,
      status?.statusText ?? (status?.statusCode ? HttpStatus[status?.statusCode] : status.errorMessage),
      payloadDto?.iotDeviceId,
      payloadDto?.payloadDecoderId
    );
  };

  public onSendError = async (err: Error, datatarget: DataTarget, payloadDto: TransformedPayloadDto) => {
    await this.handleDataTargetLogCommon(
      datatarget,
      SendStatus.ERROR,
      undefined,
      // TODO: Is there ANY risk of user-data in this error? E.g. if JSON-serialize fails on a specific prop??
      "" + err,
      payloadDto?.iotDeviceId,
      payloadDto?.payloadDecoderId
    );
  };

  private async handleDataTargetLogCommon(
    datatarget: DataTarget,
    status: SendStatus,
    statusCode?: number,
    message?: string,
    iotDeviceId?: number,
    payloadDecoderId?: number
  ) {
    // Ensures we only keep the last X number of events (specified in config) for each datatarget, before we delete the oldest ones
    if (this.datatargetLogMaxEvents) {
      const oldEventsToDelete = await this.datatargetLogRepository.find({
        where: { datatarget: { id: datatarget.id } },
        order: { createdAt: "DESC" },
        skip: this.datatargetLogMaxEvents - 1,
      });
      if (oldEventsToDelete?.length) {
        await this.datatargetLogRepository.remove(oldEventsToDelete);
      }
    }
    // Insert new event
    const logEntity: DatatargetLog = {
      // Meta-columns should be auto-populated by DB/ORM
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      // Actual data and references
      datatarget,
      type: status,
      message,
      statusCode,
      iotDevice: iotDeviceId ? ({ id: iotDeviceId } as IoTDevice) : undefined,
      payloadDecoder: payloadDecoderId ? ({ id: payloadDecoderId } as PayloadDecoder) : undefined,
    };
    await this.datatargetLogRepository.insert(logEntity);
  }

  public async getDatatargetWithRecentError(datatargetIds: number[]): Promise<Set<number>> {
    const dateLimit = new Date();
    dateLimit.setHours(dateLimit.getHours() - 24);

    const res = await this.datatargetLogRepository
      .createQueryBuilder()
      .where({
        datatarget: { id: In(datatargetIds) },
        type: SendStatus.ERROR,
        createdAt: MoreThan(dateLimit),
      })
      .select('"datatargetId"')
      .distinct(true)
      .getRawMany();

    return new Set<number>(res.map(row => row.datatargetId));
  }
}
